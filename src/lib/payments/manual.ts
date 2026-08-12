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
      // Nessuna promessa di invio: se la conferma sia partita o no lo sa
      // l'ordine, e lo dice la pagina di conferma. Qui si descrive solo
      // com'è fatto il pagamento.
      instructions:
        `L'ordine ${order.number} resta da saldare tramite bonifico. ` +
        "Appena lo riceviamo prepariamo la spedizione.",
    };
  },
};
