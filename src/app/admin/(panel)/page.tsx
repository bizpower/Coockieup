import Link from "next/link";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  Td,
  Th,
} from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { StaleStockNotice } from "@/components/admin/StaleStockNotice";
import { formatDate, formatPrice } from "@/lib/format";
import { db } from "@/lib/db";
import { getDashboardStats, getRevenueSeries } from "@/services/stats";
import { countStaleOrders } from "@/services/maintenance";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const includeDemo = demo === "1";

  const [stats, series, recentOrders, staleOrders] = await Promise.all([
    getDashboardStats({ includeDemo }),
    getRevenueSeries({ includeDemo }),
    db.order.findMany({
      where: includeDemo ? {} : { isDemo: false },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    countStaleOrders(),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ultimi 30 giorni. Il fatturato conta solo gli ordini effettivamente incassati."
      />

      <StaleStockNotice count={staleOrders} />

      {stats.demoOrderCount > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 px-4 py-3 text-sm font-medium">
          <span>
            Ci sono {stats.demoOrderCount} ordini di prova nel database.{" "}
            {includeDemo ? "Sono inclusi in questi numeri." : "Sono esclusi da questi numeri."}
          </span>
          <Link
            href={includeDemo ? "/admin" : "/admin?demo=1"}
            className="shrink-0 font-bold underline underline-offset-2"
          >
            {includeDemo ? "Escludili" : "Includili"}
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fatturato"
          value={formatPrice(stats.revenueCents)}
          hint="Ordini incassati"
          tone="brand"
        />
        <StatCard label="Ordini" value={String(stats.orderCount)} hint="Tutti gli stati" />
        <StatCard
          label="Scontrino medio"
          value={formatPrice(stats.averageOrderCents)}
          hint="Sugli ordini incassati"
        />
        <StatCard label="Nuovi clienti" value={String(stats.customerCount)} />
        <StatCard label="Pezzi venduti" value={String(stats.unitsSold)} />
        <StatCard
          label="Conversione"
          value={stats.conversionRate === null ? "—" : `${stats.conversionRate.toFixed(2)} %`}
          hint={
            stats.conversionRate === null
              ? "Servono almeno 100 visite"
              : "Ordini su visite, stima"
          }
          tone={stats.conversionRate === null ? "muted" : "default"}
        />
        <StatCard
          label="Visite al magazine"
          value={String(stats.magazineViews)}
          hint="Conteggio proprio, senza cookie"
        />
        <StatCard
          label="Da evadere"
          value={String(stats.pendingOrders)}
          hint="Ordini in attesa"
          tone={stats.pendingOrders > 0 ? "brand" : "muted"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Fatturato giornaliero" description="Ultimi 14 giorni">
          <RevenueChart data={series} />
        </Panel>

        <Panel title="Scorte in esaurimento" description="Formati sotto le 20 unità">
          {stats.lowStockVariants.length === 0 ? (
            <p className="text-cacao-soft py-6 text-center text-sm">
              Nessun formato sotto soglia.
            </p>
          ) : (
            <ul className="divide-cacao-line divide-y">
              {stats.lowStockVariants.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="font-semibold">{variant.name}</span>
                    <span className="text-cacao-soft block text-xs">{variant.sku}</span>
                  </span>
                  <span
                    className={
                      variant.stock === 0
                        ? "text-danger font-bold tabular-nums"
                        : "text-warning font-bold tabular-nums"
                    }
                  >
                    {variant.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Ultimi ordini">
          {recentOrders.length === 0 ? (
            <EmptyState
              title="Ancora nessun ordine"
              description="Quando arriverà il primo, lo troverai qui con il suo stato e il suo totale."
            />
          ) : (
            <DataTable
              head={
                <>
                  <Th>Ordine</Th>
                  <Th>Cliente</Th>
                  <Th>Data</Th>
                  <Th>Stato</Th>
                  <Th className="text-right">Totale</Th>
                </>
              }
            >
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-crema/50">
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                    >
                      {order.number}
                    </Link>
                    {order.isDemo && (
                      <span className="text-cacao-soft ml-2 text-xs font-bold">prova</span>
                    )}
                  </Td>
                  <Td className="text-cacao-soft">{order.email}</Td>
                  <Td className="text-cacao-soft whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">
                    {formatPrice(order.totalCents)}
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>
    </>
  );
}
