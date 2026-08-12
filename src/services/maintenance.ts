import "server-only";
import { db } from "@/lib/db";
import { restoreOrderReservations } from "./order";

/**
 * Manutenzione periodica.
 *
 * Due cose che, lasciate a sé stesse, peggiorano da sole col passare del tempo.
 */

/**
 * Quanto si aspetta prima di considerare perso un ordine, per metodo di pagamento.
 *
 * Non è una soglia sola, perché i due casi non si somigliano:
 *
 * - **Carta.** Stripe fa scadere la sessione dopo 24 ore; passate quelle, il
 *   pagamento non può più arrivare, e aspettare oltre tiene la merce ferma
 *   per niente.
 * - **Bonifico.** Un ordine fatto venerdì sera con bonifico avviato lunedì
 *   arriva mercoledì. Annullarlo dopo due giorni significherebbe cancellare
 *   l'ordine di qualcuno mentre i suoi soldi sono in viaggio: molto peggio
 *   che tenere qualche pezzo impegnato una settimana in più.
 */
const STALE_HOURS: Record<string, number> = {
  stripe: 36,
  manual: 24 * 10,
};

const DEFAULT_STALE_HOURS = 48;

function staleHoursFor(provider: string): number {
  return STALE_HOURS[provider] ?? DEFAULT_STALE_HOURS;
}

/** La finestra più corta fra quelle configurate: serve per la query iniziale. */
const SHORTEST_STALE_HOURS = Math.min(...Object.values(STALE_HOURS), DEFAULT_STALE_HOURS);

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
export async function releaseStaleOrders(): Promise<{ released: number; units: number }> {
  // Si parte dalla finestra più corta e si filtra per metodo: una query sola
  // invece di una per provider.
  const candidates = await db.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: new Date(Date.now() - SHORTEST_STALE_HOURS * 3600_000) },
    },
    include: { items: true },
  });

  const now = Date.now();
  const stale = candidates.filter(
    (order) => now - order.createdAt.getTime() >= staleHoursFor(order.paymentProvider) * 3600_000,
  );

  let units = 0;

  for (const order of stale) {
    await db.$transaction(async (tx) => {
      // Ricontrollo dentro la transazione: fra la lettura e qui, il pagamento
      // potrebbe essere arrivato e sarebbe un ordine valido da annullare.
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (!current || current.status !== "PENDING" || current.paymentStatus !== "UNPAID") return;

      const restored = await restoreOrderReservations(tx, order.id);
      units += restored.units;

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          adminNote: [
            current.adminNote,
            `Annullato automaticamente: non pagato entro ${staleHoursFor(current.paymentProvider)} ore.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });
    });
  }

  return { released: stale.length, units };
}

/**
 * Quanti ordini hanno superato la loro finestra.
 *
 * Usa gli stessi criteri del rilascio: un avviso che contasse ordini che poi
 * la manutenzione non tocca manderebbe qualcuno a cercare un problema
 * inesistente.
 */
export async function countStaleOrders(): Promise<number> {
  const candidates = await db.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: new Date(Date.now() - SHORTEST_STALE_HOURS * 3600_000) },
    },
    select: { createdAt: true, paymentProvider: true },
  });

  const now = Date.now();
  return candidates.filter(
    (order) => now - order.createdAt.getTime() >= staleHoursFor(order.paymentProvider) * 3600_000,
  ).length;
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
