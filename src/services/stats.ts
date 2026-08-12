import "server-only";
import { db } from "@/lib/db";

/**
 * KPI della dashboard.
 *
 * Tutto calcolato sui dati reali. Dove un numero è una stima — il tasso di
 * conversione, che senza analytics di sessione è per forza approssimato —
 * l'indicatore lo dichiara invece di far finta di essere preciso.
 *
 * `includeDemo` permette di escludere gli ordini di prova: appena il negozio
 * apre davvero, i numeri della prima settimana non devono essere sporcati
 * dagli ordini fatti per collaudare il checkout.
 */

export type DashboardStats = {
  revenueCents: number;
  orderCount: number;
  averageOrderCents: number;
  customerCount: number;
  unitsSold: number;
  /** Null se non ci sono abbastanza visite per una stima sensata. */
  conversionRate: number | null;
  magazineViews: number;
  pendingOrders: number;
  lowStockVariants: { id: string; name: string; sku: string; stock: number }[];
  demoOrderCount: number;
};

const LOW_STOCK_THRESHOLD = 20;

export async function getDashboardStats({
  days = 30,
  includeDemo = false,
}: { days?: number; includeDemo?: boolean } = {}): Promise<DashboardStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const demoFilter = includeDemo ? {} : { isDemo: false };

  // Il fatturato conta solo gli ordini incassati: contare anche il "da saldare"
  // gonfierebbe il dato con carrelli che potrebbero non arrivare mai.
  const paidWhere = {
    ...demoFilter,
    createdAt: { gte: since },
    paymentStatus: "PAID" as const,
  };

  const [revenue, orders, customerCount, items, views, pending, lowStock, demoOrderCount] =
    await Promise.all([
      db.order.aggregate({ where: paidWhere, _sum: { totalCents: true }, _count: true }),
      db.order.count({ where: { ...demoFilter, createdAt: { gte: since } } }),
      db.customer.count({ where: { createdAt: { gte: since } } }),
      db.orderItem.aggregate({
        where: { order: paidWhere },
        _sum: { quantity: true },
      }),
      db.pageView.count({ where: { createdAt: { gte: since } } }),
      db.order.count({ where: { ...demoFilter, status: "PENDING" } }),
      db.productVariant.findMany({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: "asc" },
        select: { id: true, name: true, sku: true, stock: true },
        take: 5,
      }),
      db.order.count({ where: { isDemo: true } }),
    ]);

  const paidCount = revenue._count;
  const revenueCents = revenue._sum.totalCents ?? 0;

  const magazineViews = await db.pageView.count({
    where: { createdAt: { gte: since }, path: { startsWith: "/magazine" } },
  });

  return {
    revenueCents,
    orderCount: orders,
    averageOrderCents: paidCount > 0 ? Math.round(revenueCents / paidCount) : 0,
    customerCount,
    unitsSold: items._sum.quantity ?? 0,
    // Sotto le cento visite la percentuale oscilla troppo per dire qualcosa.
    conversionRate: views >= 100 ? (orders / views) * 100 : null,
    magazineViews,
    pendingOrders: pending,
    lowStockVariants: lowStock,
    demoOrderCount,
  };
}

/** Fatturato giornaliero per il grafico, dal più vecchio al più recente. */
export async function getRevenueSeries({
  days = 14,
  includeDemo = false,
}: { days?: number; includeDemo?: boolean } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: since },
      paymentStatus: "PAID",
      ...(includeDemo ? {} : { isDemo: false }),
    },
    select: { createdAt: true, totalCents: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.totalCents);
  }

  return [...buckets.entries()].map(([date, cents]) => ({ date, cents }));
}
