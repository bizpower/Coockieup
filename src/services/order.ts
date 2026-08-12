import "server-only";
import { Prisma } from "@prisma/client";
import { BRAND_ORDER_PREFIX } from "@/config/brand";
import { db } from "@/lib/db";
import { calculateTotals } from "@/lib/pricing";

/**
 * Creazione dell'ordine.
 *
 * Tre regole che valgono più del codice che le implementa:
 *
 *  1. I prezzi si rileggono dal database dentro la transazione. Quello che
 *     arriva dal browser è una richiesta, non una fonte: chi modifica il
 *     payload non compra a prezzo scelto da sé.
 *  2. Lo stock si verifica e si decrementa nella stessa transazione. Due
 *     ordini simultanei sull'ultimo pezzo non possono passare entrambi.
 *  3. Nome, formato, SKU e prezzo unitario finiscono in copia dentro
 *     OrderItem. Ritoccare il listino non deve riscrivere gli ordini passati.
 */

export type ShippingDetails = {
  email: string;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  zip: string;
  state?: string | null;
  country: string;
  phone?: string | null;
  customerNote?: string | null;
  marketingConsent: boolean;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; number: string; totalCents: number }
  | { ok: false; message: string };

/**
 * Numerazione leggibile e progressiva per anno: SG-2026-0001.
 *
 * Il conteggio delle righe è soggetto a corsa fra due checkout simultanei;
 * l'unicità la garantisce il vincolo sulla colonna, e il chiamante ritenta.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const start = new Date(Date.UTC(year, 0, 1));

  const count = await tx.order.count({ where: { createdAt: { gte: start } } });
  return `${BRAND_ORDER_PREFIX}-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function createOrderOnce(
  cartId: string,
  details: ShippingDetails,
  paymentProviderId: string,
): Promise<CreateOrderResult> {
  return db.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cartId },
      include: { variant: { include: { product: true } } },
    });

    if (items.length === 0) return { ok: false as const, message: "Il carrello è vuoto." };

    for (const item of items) {
      if (!item.variant.isActive) {
        return {
          ok: false as const,
          message: `"${item.variant.name}" non è più disponibile. Rimuovilo dal carrello per procedere.`,
        };
      }
      if (item.quantity > item.variant.stock) {
        return {
          ok: false as const,
          message:
            item.variant.stock === 0
              ? `"${item.variant.name}" è appena andato esaurito.`
              : `Di "${item.variant.name}" ne restano ${item.variant.stock}. Aggiorna la quantità.`,
        };
      }
    }

    const cart = await tx.cart.findUnique({ where: { id: cartId } });
    const [coupon, shippingRate] = await Promise.all([
      cart?.couponCode
        ? tx.coupon.findUnique({ where: { code: cart.couponCode } })
        : Promise.resolve(null),
      tx.shippingRate.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    const totals = calculateTotals({
      lines: items.map((item) => ({
        unitPriceCents: item.variant.priceCents,
        quantity: item.quantity,
      })),
      coupon,
      shippingRate,
    });

    // Un coupon scaduto fra il momento in cui è stato inserito nel carrello e
    // il pagamento non blocca l'ordine: `calculateTotals` non lo applica e
    // qui non viene registrato. Si compra a prezzo pieno.
    const appliedCoupon = totals.couponError ? null : coupon;

    const customer = await tx.customer.upsert({
      where: { email: details.email },
      update: {
        firstName: details.name.split(" ")[0] ?? details.name,
        lastName: details.name.split(" ").slice(1).join(" ") || null,
        phone: details.phone ?? undefined,
        ...(details.marketingConsent ? { marketingConsent: true } : {}),
      },
      create: {
        email: details.email,
        firstName: details.name.split(" ")[0] ?? details.name,
        lastName: details.name.split(" ").slice(1).join(" ") || null,
        phone: details.phone ?? null,
        marketingConsent: details.marketingConsent,
      },
    });

    const order = await tx.order.create({
      data: {
        number: await nextOrderNumber(tx),
        customerId: customer.id,
        email: details.email,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentProvider: paymentProviderId,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        shippingCents: totals.shippingCents,
        totalCents: totals.totalCents,
        couponCode: appliedCoupon?.code ?? null,
        shippingName: details.name,
        shippingLine1: details.line1,
        shippingLine2: details.line2 ?? null,
        shippingCity: details.city,
        shippingZip: details.zip,
        shippingState: details.state ?? null,
        shippingCountry: details.country,
        shippingPhone: details.phone ?? null,
        customerNote: details.customerNote ?? null,
        items: {
          create: items.map((item) => ({
            variantId: item.variantId,
            nameSnapshot: item.variant.product.name,
            variantSnapshot: item.variant.name,
            skuSnapshot: item.variant.sku,
            unitPriceCents: item.variant.priceCents,
            quantity: item.quantity,
          })),
        },
      },
    });

    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return {
      ok: true as const,
      orderId: order.id,
      number: order.number,
      totalCents: order.totalCents,
    };
  });
}

/**
 * Crea l'ordine, ritentando se due checkout simultanei hanno calcolato lo
 * stesso numero progressivo.
 */
export async function createOrder(
  cartId: string,
  details: ShippingDetails,
  paymentProviderId: string,
): Promise<CreateOrderResult> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await createOrderOnce(cartId, details, paymentProviderId);
    } catch (error) {
      const isDuplicateNumber =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target ?? "").includes("number");

      if (!isDuplicateNumber) throw error;
    }
  }

  return { ok: false, message: "Non siamo riusciti a registrare l'ordine. Riprova." };
}

/** Ordine completo per la conferma e per l'area amministrativa. */
export async function getOrderByNumber(number: string) {
  return db.order.findUnique({
    where: { number },
    include: { items: true, customer: true },
  });
}

/**
 * Restituisce tutto quello che la creazione dell'ordine aveva impegnato.
 *
 * Un ordine non prenota soltanto la merce: consuma anche un utilizzo del
 * codice sconto. Finché queste due cose venivano disfatte a mano in tre punti
 * diversi, il coupon veniva dimenticato ovunque — e un codice limitato a cento
 * usi bruciava un uso a ogni carrello abbandonato, esaurendosi senza aver
 * portato una vendita.
 *
 * Sta in una funzione sola perché è l'unico modo perché i tre chiamanti non
 * tornino a divergere.
 */
export async function restoreOrderReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<{ units: number }> {
  const items = await tx.orderItem.findMany({ where: { orderId } });

  let units = 0;
  for (const item of items) {
    if (!item.variantId) continue;
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
    units += item.quantity;
  }

  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (order?.couponCode) {
    // `decrement` senza rete andrebbe sotto zero se qualcuno azzerasse il
    // contatore a mano: si scende solo se c'è davvero qualcosa da restituire.
    await tx.coupon.updateMany({
      where: { code: order.couponCode, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }

  return { units };
}

/**
 * Annulla un ordine mai pagato e rimette a scaffale la merce.
 *
 * Idempotente e prudente: se nel frattempo il pagamento è arrivato, non tocca
 * niente. Annullare un ordine incassato sarebbe molto peggio che lasciarne uno
 * scaduto in giro.
 */
export async function cancelUnpaidOrder(orderNumber: string, reason: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { number: orderNumber },
      include: { items: true },
    });

    if (!order || order.status !== "PENDING" || order.paymentStatus !== "UNPAID") return null;

    await restoreOrderReservations(tx, order.id);

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        adminNote: [order.adminNote, `Annullato automaticamente: ${reason}`]
          .filter(Boolean)
          .join("\n"),
      },
    });
  });
}

/**
 * Registra il pagamento riuscito. Idempotente: Stripe può recapitare lo stesso
 * evento più volte, e un doppio "pagato" non deve produrre effetti doppi.
 */
export async function markOrderPaid(orderNumber: string, paymentRef: string) {
  const order = await db.order.findUnique({ where: { number: orderNumber } });
  if (!order || order.paymentStatus === "PAID") return order;

  const updated = await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", status: "PAID", paymentRef },
  });

  // La conferma partita al checkout diceva "in attesa di pagamento": adesso
  // che l'incasso è arrivato ne parte una che dice la cosa giusta. L'import
  // è qui dentro per non creare un ciclo fra i due moduli.
  const { sendOrderConfirmation } = await import("./order-email");
  await sendOrderConfirmation(updated.id);

  return updated;
}
