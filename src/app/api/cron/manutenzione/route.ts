import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  prunePageViews,
  pruneAbandonedCarts,
  releaseStaleOrders,
} from "@/services/maintenance";

/**
 * Manutenzione programmata.
 *
 * Da chiamare una volta al giorno. Su Vercel lo fa `vercel.json`; altrove
 * basta un cron di sistema con `curl`.
 *
 * Non è un extra: senza qualcuno che liberi le scorte degli ordini abbandonati,
 * il magazzino si esaurisce da solo senza aver venduto niente.
 */

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`.
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    // Stessa risposta per segreto assente e segreto sbagliato: non si dice a
    // un estraneo se l'endpoint è configurato o no.
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const [orders, views, carts] = await Promise.all([
    releaseStaleOrders(),
    prunePageViews(),
    pruneAbandonedCarts(),
  ]);

  return NextResponse.json({
    ok: true,
    ordiniAnnullati: orders.released,
    pezziLiberati: orders.units,
    visiteEliminate: views.deleted,
    carrelliEliminati: carts.deleted,
  });
}
