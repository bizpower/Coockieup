import type { Metadata } from "next";
import { BRAND_LEGAL } from "@/config/brand";
import { OrderLookup } from "@/components/commerce/OrderLookup";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "I miei ordini",
  description: "Ritrova il tuo ordine con il numero e l'email usata all'acquisto.",
  robots: { index: false, follow: false },
};

/**
 * Area ordini.
 *
 * Niente registrazione al lancio: chiedere una password per comprare quindici
 * biscotti è un ostacolo che non ripaga. Il modello `Customer` è già pronto
 * per aggiungere l'autenticazione quando ci saranno abbonamenti o ordini
 * ricorrenti da gestire.
 */
export default function AccountPage() {
  return (
    <Section>
      <Container size="narrow">
        <Eyebrow>Assistenza</Eyebrow>
        <h1 className="text-display mt-4">I miei ordini</h1>
        <p className="text-lead text-cacao-soft mt-5">
          Nessun account da creare. Ti servono il numero d&apos;ordine e l&apos;email che
          hai usato: li trovi nell&apos;email di conferma.
        </p>

        <div className="mt-10">
          <OrderLookup />
        </div>

        <p className="text-cacao-soft mt-12 text-sm leading-relaxed">
          Non trovi l&apos;email di conferma? Scrivici a{" "}
          <a
            href={`mailto:${BRAND_LEGAL.supportEmail}`}
            className="hover:text-fiamma underline underline-offset-4"
          >
            {BRAND_LEGAL.supportEmail}
          </a>{" "}
          indicando nome e data dell&apos;ordine: lo ritroviamo noi.
        </p>
      </Container>
    </Section>
  );
}
