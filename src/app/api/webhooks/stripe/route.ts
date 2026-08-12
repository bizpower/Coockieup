import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments";
import { markOrderPaid } from "@/services/order";

/**
 * Webhook Stripe.
 *
 * È qui che un ordine diventa pagato, non al ritorno del cliente sul sito: la
 * pagina di conferma può non venire mai aperta, e comunque un redirect nel
 * browser non è una prova di incasso.
 *
 * Il corpo va letto come testo grezzo: la firma è calcolata sui byte esatti
 * inviati da Stripe, e un JSON.parse seguito da re-serializzazione la invalida.
 */

type StripeEvent = {
  type: string;
  data: {
    object: {
      id?: string;
      client_reference_id?: string;
      payment_intent?: string;
      metadata?: { order_number?: string };
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configurato." }, { status: 503 });
  }

  const payload = await request.text();

  const verification = verifyStripeSignature({
    payload,
    header: request.headers.get("stripe-signature"),
    secret,
  });

  if (!verification.ok) {
    return NextResponse.json({ error: verification.reason }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Corpo non leggibile." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderNumber = session.client_reference_id ?? session.metadata?.order_number;

    if (orderNumber) {
      await markOrderPaid(orderNumber, session.payment_intent ?? session.id ?? "");
    }
  }

  // Gli altri eventi vengono accettati senza azione: rispondere con un errore
  // farebbe ritentare Stripe all'infinito su eventi che non ci interessano.
  return NextResponse.json({ received: true });
}
