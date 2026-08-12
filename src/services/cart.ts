import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { db } from "@/lib/db";
import { calculateTotals, type Totals } from "@/lib/pricing";
import { getActiveShippingRate } from "./catalog";

/**
 * Il carrello.
 *
 * Vive nel database, agganciato a un cookie httpOnly. Non in localStorage:
 * così sopravvive al refresh, è leggibile dal server durante il rendering
 * (niente sfarfallio del contatore) e resta ispezionabile dall'assistenza
 * quando un cliente scrive "ho perso il carrello".
 */

const CART_COOKIE = "cart_token";
const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

export type CartLineView = {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  compareAtCents: number | null;
  lineTotalCents: number;
  name: string;
  variantName: string;
  sku: string;
  boxCount: number;
  productSlug: string;
  stock: number;
};

export type CartView = {
  id: string | null;
  lines: CartLineView[];
  itemCount: number;
  couponCode: string | null;
  totals: Totals;
};

const EMPTY_TOTALS: Totals = {
  subtotalCents: 0,
  discountCents: 0,
  shippingCents: 0,
  totalCents: 0,
  toFreeShippingCents: 0,
  freeShippingThresholdCents: null,
  couponError: null,
};

/** Il token del carrello corrente, senza crearne uno. */
async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/**
 * Il carrello corrente, creandolo se serve.
 *
 * Va chiamata solo da una Server Action: scrivere un cookie durante il
 * rendering di una pagina non è permesso, ed è giusto così — una GET non
 * dovrebbe creare righe nel database.
 */
export async function getOrCreateCart() {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await db.cart.findUnique({ where: { token } });
    if (existing) return existing;
  }

  const cart = await db.cart.create({ data: { token: randomUUID() } });

  store.set(CART_COOKIE, cart.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_MAX_AGE,
    path: "/",
  });

  return cart;
}

/**
 * Il carrello per il rendering. Non crea nulla: se il cookie non c'è, il
 * carrello è vuoto e basta.
 */
export const getCartView = cache(async (): Promise<CartView> => {
  const token = await readCartToken();
  if (!token) return { id: null, lines: [], itemCount: 0, couponCode: null, totals: EMPTY_TOTALS };

  const cart = await db.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
        orderBy: { variant: { sortOrder: "asc" } },
      },
    },
  });

  if (!cart) return { id: null, lines: [], itemCount: 0, couponCode: null, totals: EMPTY_TOTALS };

  const lines: CartLineView[] = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPriceCents: item.variant.priceCents,
    compareAtCents: item.variant.compareAtCents,
    lineTotalCents: item.variant.priceCents * item.quantity,
    name: item.variant.product.name,
    variantName: item.variant.name,
    sku: item.variant.sku,
    boxCount: item.variant.boxCount,
    productSlug: item.variant.product.slug,
    stock: item.variant.stock,
  }));

  const [coupon, shippingRate] = await Promise.all([
    cart.couponCode
      ? db.coupon.findUnique({ where: { code: cart.couponCode } })
      : Promise.resolve(null),
    getActiveShippingRate(),
  ]);

  return {
    id: cart.id,
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    couponCode: cart.couponCode,
    totals: calculateTotals({ lines, coupon, shippingRate }),
  };
});

/** Il contatore in navbar. Query minima: non serve caricare tutto il carrello. */
export const getCartCount = cache(async (): Promise<number> => {
  const token = await readCartToken();
  if (!token) return 0;

  const result = await db.cartItem.aggregate({
    where: { cart: { token } },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
});

/** Dopo un ordine il carrello si svuota, ma il cookie resta: il prossimo riparte da lì. */
export async function clearCart(cartId: string) {
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
}
