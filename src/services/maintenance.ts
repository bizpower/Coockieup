import "server-only";
import { db } from "@/lib/db";

/**
 * Manutenzione periodica.
 *
 * Due cose che, lasciate a sé stesse, peggiorano da sole col passare del tempo.
 */

/**
 * Scorte bloccate da ordini mai pagati.
 *
 * Lo stock viene scalato quando l'ordine viene creato, non quando il pagamento
 * arriva: è l'unico modo per impedire che due persone comprino l'ultimo pezzo
 * nello stesso momento. Il rovescio è che un checkout abbandonato — la scheda
 * di Stripe chiusa senza pagare — tiene quella merce impegnata per sempre.
 *
 * Su un magazzino di poche centinaia di pezzi e con i tassi di abbandono
 * normali di un e-commerce, in poche settimane il negozio risulterebbe
 * esaurito senza aver venduto niente.
 *
 * Qui gli ordini rimasti da saldare oltre la soglia vengono annullati e la
 * merce torna disponibile. La finestra predefinita è larga: meglio tenere un
 * pezzo impegnato una notte in più che annullare l'ordine di qualcuno che sta
 * ancora facendo il bonifico.
 */
export async function releaseStaleOrders({
  olderThanHours = 48,
}: { olderThanHours?: number } = {}): Promise<{ released: number; units: number }> {
  const threshold = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const stale = await db.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: threshold },
    },
    include: { items: true },
  });

  let units = 0;

  for (const order of stale) {
    await db.$transaction(async (tx) => {
      // Ricontrollo dentro la transazione: fra la lettura e qui, il pagamento
      // potrebbe essere arrivato e sarebbe un ordine valido da annullare.
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (!current || current.status !== "PENDING" || current.paymentStatus !== "UNPAID") return;

      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        units += item.quantity;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          adminNote: [current.adminNote, `Annullato automaticamente: non pagato entro ${olderThanHours} ore.`]
            .filter(Boolean)
            .join("\n"),
        },
      });
    });
  }

  return { released: stale.length, units };
}

/** Quanti ordini sono in attesa da troppo tempo. Serve all'avviso in dashboard. */
export async function countStaleOrders(olderThanHours = 48): Promise<number> {
  return db.order.count({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: new Date(Date.now() - olderThanHours * 60 * 60 * 1000) },
    },
  });
}

/**
 * Conteggio visite: una riga per visualizzazione, per sempre.
 *
 * Serve al KPI del traffico, che guarda gli ultimi 30 giorni: tenere anni di
 * righe fa solo crescere il database e rallentare le query. Un anno è più che
 * sufficiente per un confronto anno su anno.
 */
export async function prunePageViews({ keepDays = 365 }: { keepDays?: number } = {}) {
  const { count } = await db.pageView.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000) } },
  });

  return { deleted: count };
}

/** Svuota anche i carrelli abbandonati da mesi: non servono più a nessuno. */
export async function pruneAbandonedCarts({ keepDays = 60 }: { keepDays?: number } = {}) {
  const { count } = await db.cart.deleteMany({
    where: { updatedAt: { lt: new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000) } },
  });

  return { deleted: count };
}
