import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { Badge } from "@/components/ui/Badge";
import { Container, Section } from "@/components/ui/Layout";
import { formatPrice } from "@/lib/format";
import { getPaymentProvider, isStripeConfigured } from "@/lib/payments";
import { getCartView } from "@/services/cart";

export const metadata: Metadata = {
  title: "Cassa",
  robots: { index: false, follow: false },
};

/**
 * Cassa.
 *
 * Il carrello vuoto rimanda allo shop invece di mostrare un modulo che non
 * porterebbe da nessuna parte. L'etichetta del bottone dipende dal provider
 * attivo: con Stripe configurato si va al pagamento, altrimenti l'ordine viene
 * registrato come da saldare, e la pagina lo dice chiaramente.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ annullato?: string }>;
}) {
  const [cart, { annullato }] = await Promise.all([getCartView(), searchParams]);

  if (cart.lines.length === 0) redirect("/shop");

  const provider = getPaymentProvider();
  const stripeReady = isStripeConfigured();

  return (
    <Section>
      <Container>
        <h1 className="text-display">Cassa</h1>

        {annullato && (
          <p className="border-warning bg-energy-wash mt-6 border-l-4 px-5 py-4 text-sm font-medium">
            Pagamento annullato. Il carrello è rimasto com&apos;era: puoi riprovare quando vuoi.
          </p>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <CheckoutForm
              payLabel={stripeReady ? `Paga ${formatPrice(cart.totals.totalCents)}` : "Conferma l'ordine"}
            />
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <OrderSummary totals={cart.totals} couponCode={cart.couponCode}>
              <ul className="border-cacao-line mt-6 space-y-3 border-t pt-5 text-sm">
                {cart.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4">
                    <span>
                      <span className="font-medium">{line.name}</span>
                      <span className="text-cacao-soft block text-xs">
                        {line.variantName} × {line.quantity}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatPrice(line.lineTotalCents)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/cart"
                className="text-cacao-soft hover:text-cacao mt-5 inline-block text-sm font-semibold underline underline-offset-4 transition-colors"
              >
                Modifica il carrello
              </Link>
            </OrderSummary>

            <div className="border-cacao-line mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">Pagamento</h2>
                <Badge tone={stripeReady ? "neutral" : "warning"}>{provider.label}</Badge>
              </div>

              <p className="text-cacao-soft mt-2.5 text-sm leading-relaxed">
                {stripeReady ? (
                  <>
                    Al passo successivo apriremo la pagina di pagamento sicura. Non
                    vediamo né conserviamo i dati della tua carta.
                  </>
                ) : (
                  <>
                    Il pagamento con carta non è ancora attivo. Registriamo
                    l&apos;ordine e ti inviamo per email i dati per il bonifico:
                    prepariamo la spedizione appena lo riceviamo.
                  </>
                )}
              </p>
            </div>

            <p className="text-cacao-soft mt-5 text-xs leading-relaxed">
              Confermando accetti i{" "}
              <Link href="/legal/termini-e-condizioni" className="underline underline-offset-2">
                termini e condizioni
              </Link>{" "}
              e la{" "}
              <Link href="/legal/privacy-policy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
