/**
 * Il confine con il pagamento.
 *
 * Il flusso ordini conosce solo questa interfaccia. Cambiare provider — o
 * aggiungerne un secondo — significa scrivere un altro file in questa cartella,
 * non toccare il checkout.
 */

export type PaymentOrder = {
  number: string;
  email: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  lines: { name: string; unitPriceCents: number; quantity: number }[];
};

export type PaymentIntentResult =
  | {
      /** Il cliente va mandato sulla pagina di pagamento del provider. */
      kind: "redirect";
      url: string;
      reference: string;
    }
  | {
      /** Nessun pagamento online: l'ordine resta da saldare. */
      kind: "deferred";
      reference: string | null;
      instructions: string;
    };

export interface PaymentProvider {
  /** Finisce in `Order.paymentProvider`. */
  readonly id: string;
  /** Etichetta mostrata al cliente in fase di checkout. */
  readonly label: string;
  createPayment(order: PaymentOrder): Promise<PaymentIntentResult>;
}
