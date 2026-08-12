"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPaymentProvider } from "@/lib/payments";
import { clearCart, getOrCreateCart } from "@/services/cart";
import { createOrder, getOrderByNumber } from "@/services/order";

/**
 * Conclusione dell'ordine.
 *
 * Il carrello viene svuotato solo dopo che l'ordine esiste nel database. Se il
 * provider di pagamento fallisce dopo la creazione, il cliente ritrova
 * l'ordine da saldare invece di ritrovarsi senza carrello e senza ordine.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Serve un indirizzo email valido."),
  name: z.string().trim().min(2, "Inserisci nome e cognome.").max(120),
  line1: z.string().trim().min(3, "Inserisci l'indirizzo.").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Inserisci la città.").max(80),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Il CAP è composto da 5 cifre."),
  state: z.string().trim().max(60).optional(),
  country: z.string().trim().length(2).default("IT"),
  phone: z.string().trim().max(30).optional(),
  customerNote: z.string().trim().max(500).optional(),
  marketingConsent: z.boolean().default(false),
});

export type CheckoutState = {
  status: "idle" | "error";
  message?: string;
  /** Errori per campo, per evidenziare l'input sbagliato. */
  fieldErrors?: Record<string, string>;
  /**
   * I valori appena inviati, rimandati indietro al modulo.
   *
   * React azzera un form dopo l'esecuzione di una action: senza questo, un
   * errore di validazione cancellerebbe l'indirizzo appena digitato. Il modulo
   * li rimette come valori di default.
   */
  values?: Record<string, string>;
};

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    email: formData.get("email")?.toString(),
    name: formData.get("name")?.toString(),
    line1: formData.get("line1")?.toString(),
    line2: formData.get("line2")?.toString() || undefined,
    city: formData.get("city")?.toString(),
    zip: formData.get("zip")?.toString(),
    state: formData.get("state")?.toString() || undefined,
    country: formData.get("country")?.toString() || "IT",
    phone: formData.get("phone")?.toString() || undefined,
    customerNote: formData.get("customerNote")?.toString() || undefined,
    marketingConsent: formData.get("marketingConsent") === "on",
  });

  // Quanto è stato digitato torna indietro comunque, valido o no.
  const submitted: Record<string, string> = {};
  for (const field of ["email", "name", "line1", "line2", "city", "zip", "state", "phone", "customerNote"]) {
    const value = formData.get(field)?.toString();
    if (value) submitted[field] = value;
  }

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return {
      status: "error",
      message: "Controlla i campi segnalati.",
      fieldErrors,
      values: submitted,
    };
  }

  const cart = await getOrCreateCart();
  const provider = getPaymentProvider();

  const result = await createOrder(cart.id, parsed.data, provider.id);
  if (!result.ok) return { status: "error", message: result.message, values: submitted };

  let destination = `/order-confirmation/${result.number}`;

  try {
    // Le righe per il pagamento si rileggono dall'ordine appena scritto, non
    // dal carrello: è l'ordine la fonte di verità di cosa viene addebitato.
    const order = await getOrderByNumber(result.number);
    if (!order) throw new Error("Ordine non ritrovato dopo la creazione.");

    const payment = await provider.createPayment({
      number: order.number,
      email: order.email,
      totalCents: order.totalCents,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      lines: order.items.map((item) => ({
        name: `${item.nameSnapshot} — ${item.variantSnapshot}`,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
    });

    if (payment.kind === "redirect") destination = payment.url;
  } catch {
    // L'ordine è già registrato: si prosegue verso la conferma, dove il
    // cliente vede che risulta da pagare, invece di perdere tutto.
    destination = `/order-confirmation/${result.number}?pagamento=non-riuscito`;
  }

  await clearCart(cart.id);
  revalidatePath("/", "layout");

  redirect(destination);
}
