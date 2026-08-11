import { CURRENCY } from "@/config/site";

/**
 * I prezzi vivono in centesimi interi per tutto il progetto: database,
 * carrello, ordini. I decimali in virgola mobile sui soldi generano
 * arrotondamenti che poi non tornano in fattura.
 */

const priceFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/** Prezzo per singola confezione dentro un bundle, per mostrare il risparmio. */
export function formatUnitPrice(cents: number, boxCount: number): string {
  if (boxCount <= 1) return formatPrice(cents);
  return formatPrice(Math.round(cents / boxCount));
}

/** Sconto percentuale tra prezzo pieno e prezzo di vendita. */
export function discountPercent(priceCents: number, compareAtCents: number | null): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
