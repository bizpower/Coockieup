import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/config/site";
import type { PaymentOrder, PaymentProvider } from "./types";

/**
 * Stripe via API REST, senza SDK.
 *
 * L'SDK ufficiale porta un albero di dipendenze considerevole per fare due
 * chiamate HTTP e una verifica di firma. Qui basta `fetch` e `node:crypto`, e
 * l'integrazione è reale: se le chiavi ci sono, il cliente paga davvero.
 *
 * Documentazione: https://docs.stripe.com/api/checkout/sessions/create
 */

const STRIPE_API = "https://api.stripe.com/v1";

function apiKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY non configurata.");
  return key;
}

/**
 * Stripe accetta solo `application/x-www-form-urlencoded` con la notazione a
 * parentesi per gli oggetti annidati: `line_items[0][price_data][currency]`.
 */
function encodeForm(data: Record<string, string | number>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

async function stripePost<T>(path: string, body: Record<string, string | number>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(body),
  });

  const payload = (await response.json()) as { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe ha risposto ${response.status}.`);
  }

  return payload as T;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Carta di credito",

  async createPayment(order: PaymentOrder) {
    const form: Record<string, string | number> = {
      mode: "payment",
      customer_email: order.email,
      // Torna nel webhook: è così che l'ordine viene ritrovato al pagamento.
      client_reference_id: order.number,
      "metadata[order_number]": order.number,
      success_url: `${SITE_URL}/order-confirmation/${order.number}`,
      cancel_url: `${SITE_URL}/checkout?annullato=1`,
      locale: "it",
    };

    order.lines.forEach((line, i) => {
      form[`line_items[${i}][quantity]`] = line.quantity;
      form[`line_items[${i}][price_data][currency]`] = "eur";
      form[`line_items[${i}][price_data][unit_amount]`] = line.unitPriceCents;
      form[`line_items[${i}][price_data][product_data][name]`] = line.name;
    });

    if (order.shippingCents > 0) {
      const i = order.lines.length;
      form[`line_items[${i}][quantity]`] = 1;
      form[`line_items[${i}][price_data][currency]`] = "eur";
      form[`line_items[${i}][price_data][unit_amount]`] = order.shippingCents;
      form[`line_items[${i}][price_data][product_data][name]`] = "Spedizione";
    }

    // Lo sconto non si può sottrarre dalle righe senza falsare i prezzi
    // unitari: si crea un coupon usa e getta con l'importo esatto, così la
    // cifra addebitata coincide al centesimo con il totale mostrato.
    if (order.discountCents > 0) {
      const coupon = await stripePost<{ id: string }>("/coupons", {
        amount_off: order.discountCents,
        currency: "eur",
        duration: "once",
        name: `Sconto ordine ${order.number}`,
        max_redemptions: 1,
      });
      form["discounts[0][coupon]"] = coupon.id;
    }

    const session = await stripePost<{ id: string; url: string }>("/checkout/sessions", form);

    return { kind: "redirect" as const, url: session.url, reference: session.id };
  },
};

/** Stripe è utilizzabile solo se ha entrambe le chiavi. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/**
 * Verifica della firma del webhook.
 *
 * Senza questo controllo chiunque conosca l'URL potrebbe dichiarare pagato un
 * ordine con una POST. Il confronto è a tempo costante: un confronto normale
 * fa trapelare, dal tempo di risposta, quanti caratteri iniziali sono corretti.
 */
export function verifyStripeSignature({
  payload,
  header,
  secret,
  toleranceSeconds = 300,
}: {
  payload: string;
  header: string | null;
  secret: string;
  toleranceSeconds?: number;
}): { ok: true } | { ok: false; reason: string } {
  if (!header) return { ok: false, reason: "Firma assente." };

  const parts = new Map(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim() ?? "", value?.trim() ?? ""] as const;
    }),
  );

  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return { ok: false, reason: "Firma malformata." };

  // Blocca il riuso di una richiesta valida catturata in passato.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    return { ok: false, reason: "Firma scaduta." };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "Firma non valida." };
  }

  return { ok: true };
}
