import type { PaymentOrder, PaymentProvider } from "./types";

/**
 * Provider di ripiego, attivo finché Stripe non è configurato.
 *
 * Non finge un pagamento: crea l'ordine in stato "da saldare" e lo dichiara al
 * cliente. Serve a poter provare l'intero flusso — carrello, checkout, ordine,
 * area amministrativa — senza chiavi, e a incassare per bonifico se il negozio
 * apre prima che il conto Stripe sia pronto.
 */
export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "Bonifico bancario",

  async createPayment(order: PaymentOrder) {
    return {
      kind: "deferred" as const,
      reference: null,
      instructions:
        `Ti abbiamo inviato il riepilogo dell'ordine ${order.number} via email. ` +
        "Appena riceviamo il bonifico prepariamo la spedizione.",
    };
  },
};
