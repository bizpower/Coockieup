"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateCoupon } from "@/lib/pricing";
import { getOrCreateCart } from "@/services/cart";

/**
 * Azioni sul carrello.
 *
 * Ogni azione che tocca una riga esistente verifica che quella riga appartenga
 * al carrello del cookie corrente. Senza quel controllo basterebbe indovinare
 * un id per modificare il carrello di un'altra persona.
 */

export type ActionResult = { ok: boolean; message?: string };

/** Le pagine che mostrano il carrello. Il layout copre navbar e drawer. */
function revalidateCart() {
  revalidatePath("/", "layout");
}

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export async function addToCart(input: {
  variantId: string;
  quantity: number;
}): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Richiesta non valida." };

  const variant = await db.productVariant.findUnique({
    where: { id: parsed.data.variantId },
  });

  if (!variant || !variant.isActive) {
    return { ok: false, message: "Questo formato non è più disponibile." };
  }

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });

  const wanted = (existing?.quantity ?? 0) + parsed.data.quantity;

  if (wanted > variant.stock) {
    return {
      ok: false,
      message:
        variant.stock === 0
          ? "Questo formato è esaurito."
          : `Ne restano ${variant.stock}. Non possiamo aggiungerne altri.`,
    };
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: wanted },
    create: { cartId: cart.id, variantId: variant.id, quantity: parsed.data.quantity },
  });

  revalidateCart();
  return { ok: true };
}

export async function updateCartLine(itemId: string, quantity: number): Promise<ActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) {
    return { ok: false, message: "Quantità non valida." };
  }

  const cart = await getOrCreateCart();
  const item = await db.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: true },
  });

  if (!item) return { ok: false, message: "Articolo non trovato nel carrello." };

  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    revalidateCart();
    return { ok: true };
  }

  if (quantity > item.variant.stock) {
    return { ok: false, message: `Ne restano solo ${item.variant.stock}.` };
  }

  await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  revalidateCart();
  return { ok: true };
}

export async function removeCartLine(itemId: string): Promise<ActionResult> {
  const cart = await getOrCreateCart();
  const deleted = await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });

  if (deleted.count === 0) return { ok: false, message: "Articolo non trovato." };

  revalidateCart();
  return { ok: true };
}

export async function applyCoupon(rawCode: string): Promise<ActionResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: "Inserisci un codice." };

  const cart = await getOrCreateCart();
  const items = await db.cartItem.findMany({
    where: { cartId: cart.id },
    include: { variant: true },
  });

  if (items.length === 0) {
    return { ok: false, message: "Aggiungi qualcosa al carrello prima di usare un codice." };
  }

  const subtotal = items.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0);
  const coupon = await db.coupon.findUnique({ where: { code } });
  const check = validateCoupon(coupon, subtotal);

  if (!check.ok) return { ok: false, message: check.reason };

  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  revalidateCart();
  return { ok: true, message: "Codice applicato." };
}

export async function removeCoupon(): Promise<ActionResult> {
  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidateCart();
  return { ok: true };
}
