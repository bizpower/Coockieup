import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Registrazione di una visita.
 *
 * Salva solo percorso e provenienza. Nessun indirizzo IP, nessun
 * identificatore, nessun cookie: non serve un banner di consenso perché non
 * c'è niente da consentire.
 *
 * Il percorso viene validato contro una forma attesa: senza, chiunque potrebbe
 * riempire la tabella di righe arbitrarie e falsare le statistiche.
 */

const schema = z.object({
  path: z
    .string()
    .max(300)
    .regex(/^\/[a-zA-Z0-9\-_/]*$/, "Percorso non valido"),
  referrer: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.pageView.create({
      data: { path: parsed.data.path, referrer: parsed.data.referrer ?? null },
    });
  } catch {
    // Il conteggio non deve mai far fallire nulla di visibile.
  }

  return NextResponse.json({ ok: true });
}
