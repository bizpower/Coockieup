import { manualProvider } from "./manual";
import { isStripeConfigured, stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export type { PaymentOrder, PaymentIntentResult, PaymentProvider } from "./types";
export { verifyStripeSignature } from "./stripe";

/**
 * Il provider attivo lo decidono le variabili d'ambiente, non il codice.
 *
 * Con le chiavi Stripe presenti si paga con carta; senza, l'ordine viene creato
 * come da saldare. Nessun flag da ricordare di girare al momento del lancio:
 * si aggiungono le chiavi e il checkout cambia comportamento.
 */
export function getPaymentProvider(): PaymentProvider {
  return isStripeConfigured() ? stripeProvider : manualProvider;
}

export { isStripeConfigured };
