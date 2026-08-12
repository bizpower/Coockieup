"use server";

import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Ricerca di un ordine senza account.
 *
 * Al lancio non c'è registrazione: si ritrova l'ordine con numero **e** email.
 * Il numero da solo non basta di proposito — è progressivo, quindi indovinabile
 * — e l'email è ciò che lega la richiesta a chi ha comprato.
 *
 * La risposta è identica sia che l'ordine non esista sia che l'email non
 * corrisponda: distinguere i due casi direbbe a un estraneo quali numeri
 * d'ordine sono validi.
 */

const schema = z.object({
  number: z.string().trim().min(3).max(40),
  email: z.string().trim().toLowerCase().email("Serve un indirizzo email valido."),
});

export type FoundOrder = {
  number: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  trackingCode: string | null;
  items: { id: string; name: string; variant: string; quantity: number; totalCents: number }[];
};

export type LookupState = {
  status: "idle" | "found" | "error";
  message?: string;
  order?: FoundOrder;
};

export async function lookupOrder(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const parsed = schema.safeParse({
    number: formData.get("number")?.toString(),
    email: formData.get("email")?.toString(),
  });

  if (!parsed.success) {
    return { status: "error", message: "Controlla numero d'ordine ed email." };
  }

  const order = await db.order.findFirst({
    where: {
      number: { equals: parsed.data.number, mode: "insensitive" },
      email: parsed.data.email,
    },
    include: { items: true },
  });

  if (!order) {
    return {
      status: "error",
      message: "Nessun ordine con questo numero e questa email. Controlla l'email di conferma.",
    };
  }

  return {
    status: "found",
    order: {
      number: order.number,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalCents: order.totalCents,
      trackingCode: order.trackingCode,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.nameSnapshot,
        variant: item.variantSnapshot,
        quantity: item.quantity,
        totalCents: item.unitPriceCents * item.quantity,
      })),
    },
  };
}
