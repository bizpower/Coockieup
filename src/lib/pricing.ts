import type { Coupon, ShippingRate } from "@prisma/client";

/**
 * Il calcolo del totale, in un posto solo.
 *
 * Carrello, checkout, riepilogo ordine e area amministrativa chiamano tutti
 * questa funzione. Duplicare la formula anche una volta sola significa, prima
 * o poi, mostrare un totale nel carrello e addebitarne un altro.
 *
 * Tutto in centesimi interi: nessun arrotondamento in virgola mobile.
 */

export type PricedLine = {
  unitPriceCents: number;
  quantity: number;
};

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  /** Quanto manca alla spedizione gratuita. 0 se già raggiunta o non prevista. */
  toFreeShippingCents: number;
  freeShippingThresholdCents: number | null;
  /** Perché il coupon non è stato applicato. `null` se è tutto a posto. */
  couponError: string | null;
};

/** Il coupon è valido adesso e per questo importo? */
export function validateCoupon(
  coupon: Coupon | null,
  subtotalCents: number,
  now = new Date(),
): { ok: true } | { ok: false; reason: string } {
  if (!coupon) return { ok: false, reason: "Codice non valido." };
  if (!coupon.isActive) return { ok: false, reason: "Questo codice non è più attivo." };
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, reason: "Questo codice non è ancora valido." };
  if (coupon.expiresAt && coupon.expiresAt < now)
    return { ok: false, reason: "Questo codice è scaduto." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, reason: "Questo codice ha esaurito gli utilizzi." };
  if (subtotalCents < coupon.minSubtotalCents)
    return {
      ok: false,
      reason: `Il codice vale da ${(coupon.minSubtotalCents / 100).toFixed(2).replace(".", ",")} € in su.`,
    };
  return { ok: true };
}

export function calculateTotals({
  lines,
  coupon,
  shippingRate,
  now = new Date(),
}: {
  lines: PricedLine[];
  coupon?: Coupon | null;
  shippingRate?: ShippingRate | null;
  now?: Date;
}): Totals {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );

  let discountCents = 0;
  let couponError: string | null = null;
  let forceFreeShipping = false;

  if (coupon) {
    const check = validateCoupon(coupon, subtotalCents, now);
    if (!check.ok) {
      couponError = check.reason;
    } else if (coupon.type === "PERCENT") {
      discountCents = Math.round((subtotalCents * coupon.value) / 100);
    } else if (coupon.type === "FIXED") {
      // Uno sconto fisso non può superare il carrello: niente totali negativi.
      discountCents = Math.min(coupon.value, subtotalCents);
    } else {
      forceFreeShipping = true;
    }
  }

  const afterDiscount = subtotalCents - discountCents;
  const threshold = shippingRate?.freeOverCents ?? null;

  // Il carrello vuoto non ha spese di spedizione: mostrarle prima che ci sia
  // qualcosa dentro fa sembrare il negozio più caro di quello che è.
  let shippingCents = 0;
  if (lines.length > 0 && shippingRate) {
    const qualifiesFree = threshold !== null && afterDiscount >= threshold;
    shippingCents = qualifiesFree || forceFreeShipping ? 0 : shippingRate.priceCents;
  }

  const toFreeShippingCents =
    lines.length > 0 && threshold !== null && afterDiscount < threshold && !forceFreeShipping
      ? threshold - afterDiscount
      : 0;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
    toFreeShippingCents,
    freeShippingThresholdCents: threshold,
    couponError,
  };
}
