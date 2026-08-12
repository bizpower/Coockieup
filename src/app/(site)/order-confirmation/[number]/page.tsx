import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookieShape } from "@/components/brand/CookieShape";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Layout";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrderByNumber } from "@/services/order";

export const metadata: Metadata = {
  title: "Ordine confermato",
  robots: { index: false, follow: false },
};

/**
 * Conferma d'ordine.
 *
 * Il numero d'ordine è la cosa più grande della pagina: è quello che serve
 * all'assistenza, ed è quello che le persone cercano quando tornano.
 *
 * Lo stato del pagamento viene letto dall'ordine, non dedotto dal fatto che
 * l'utente sia atterrato qui: chi torna da Stripe può arrivarci prima che il
 * webhook abbia registrato l'incasso.
 */
export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ pagamento?: string }>;
}) {
  const [{ number }, { pagamento }] = await Promise.all([params, searchParams]);
  const order = await getOrderByNumber(decodeURIComponent(number));

  if (!order) notFound();

  const paymentFailed = pagamento === "non-riuscito";
  const awaitingPayment = order.paymentStatus === "UNPAID";

  return (
    <Section>
      <Container size="narrow">
        <div className="flex items-start gap-5">
          <div className="w-16 shrink-0 sm:w-20">
            <CookieShape shape="life" />
          </div>
          <div>
            <p className="eyebrow text-fiamma">Ordine registrato</p>
            <h1 className="text-display mt-3">Grazie. Ci pensiamo noi.</h1>
          </div>
        </div>

        <div className="rounded-card bg-crema grain mt-10 p-6 sm:p-8">
          <p className="text-cacao-soft text-sm font-semibold">Numero d&apos;ordine</p>
          <p className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {order.number}
          </p>
          <p className="text-cacao-soft mt-3 text-sm">
            Ti abbiamo scritto a <span className="text-cacao font-semibold">{order.email}</span>.
            Conserva questo numero: serve per ritrovare l&apos;ordine da{" "}
            <Link href="/account" className="underline underline-offset-2">
              I miei ordini
            </Link>
            .
          </p>
        </div>

        {paymentFailed && (
          <p className="border-danger bg-fiamma-wash text-danger mt-6 border-l-4 px-5 py-4 text-sm font-semibold">
            Non siamo riusciti ad aprire la pagina di pagamento. L&apos;ordine è
            registrato e risulta da saldare: scrivici e lo sistemiamo insieme.
          </p>
        )}

        {awaitingPayment && !paymentFailed && (
          <p className="border-warning bg-energy-wash mt-6 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
            {order.paymentProvider === "manual"
              ? "L'ordine è in attesa di pagamento: trovi i dati per il bonifico nell'email di conferma. Prepariamo la spedizione appena lo riceviamo."
              : "Stiamo attendendo la conferma del pagamento. Se hai completato l'operazione, questa pagina si aggiorna entro qualche minuto."}
          </p>
        )}

        <section aria-labelledby="riepilogo-titolo" className="mt-12">
          <h2 id="riepilogo-titolo" className="font-display text-xl font-extrabold tracking-tight">
            Cosa hai ordinato
          </h2>

          <ul className="border-cacao-line divide-cacao-line mt-5 divide-y border-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-6 py-4">
                <span>
                  <span className="font-semibold">{item.nameSnapshot}</span>
                  <span className="text-cacao-soft block text-sm">
                    {item.variantSnapshot} × {item.quantity}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-cacao-soft">Subtotale</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 && (
              <div className="text-success flex justify-between gap-4">
                <dt>Sconto{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd className="tabular-nums">−{formatPrice(order.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-cacao-soft">Spedizione</dt>
              <dd className="tabular-nums">
                {order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}
              </dd>
            </div>
            <div className="border-cacao-line flex justify-between gap-4 border-t pt-3 text-lg">
              <dt className="font-display font-extrabold">Totale</dt>
              <dd className="font-display font-extrabold tabular-nums">
                {formatPrice(order.totalCents)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="spedizione-titolo" className="mt-12">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id="spedizione-titolo"
              className="font-display text-xl font-extrabold tracking-tight"
            >
              Spedizione
            </h2>
            <Badge tone="outline">Ordine del {formatDate(order.createdAt)}</Badge>
          </div>

          <address className="text-cacao-soft mt-4 text-[0.9375rem] leading-relaxed not-italic">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 && (
              <>
                <br />
                {order.shippingLine2}
              </>
            )}
            <br />
            {order.shippingZip} {order.shippingCity}
            {order.shippingState && ` (${order.shippingState})`}
            <br />
            {order.shippingCountry}
          </address>
        </section>

        <ButtonLink href="/shop" variant="outline" className="mt-12">
          Torna allo shop
        </ButtonLink>
      </Container>
    </Section>
  );
}
