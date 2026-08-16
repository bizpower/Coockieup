import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * I punti vendita che il sito può dichiarare.
 *
 * Il filtro è doppio e non è pignoleria. `isPublished` è la scelta editoriale
 * — questa scheda la mostro o no. `isConfirmed` è un'altra cosa: dice che
 * l'accordo con quel negozio è reale e verificato. Una scheda scritta in
 * bozza, con l'indirizzo ancora da controllare, non deve poter finire in
 * pagina per una spunta dimenticata.
 *
 * Sono dati su attività di altri: sbagliarli manda un cliente a vuoto e mette
 * in mezzo un negozio che non ha mai detto niente.
 */
export const getPublishedPartners = cache(async () =>
  db.retailPartner.findMany({
    where: { isPublished: true, isConfirmed: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  }),
);

/** Quante schede aspettano una conferma: lo dice la checklist di lancio. */
export const countUnconfirmedPartners = cache(async () =>
  db.retailPartner.count({ where: { isConfirmed: false } }),
);
