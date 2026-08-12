import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_LEGAL } from "@/config/brand";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Domande frequenti",
  description:
    "Quanti biscotti ci sono, quali gusti, come vengono spediti. Le risposte che abbiamo, e quelle che non abbiamo ancora.",
  alternates: { canonical: "/faq" },
};

const GROUP_LABELS: Record<string, string> = {
  prodotto: "Il prodotto",
  spedizioni: "Spedizioni e consegne",
  ordini: "Ordini e pagamenti",
};

export default async function FaqPage() {
  const items = await db.faqItem.findMany({
    where: { isPublished: true },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });

  const groups = [...new Set(items.map((item) => item.group))];
  const unconfirmed = items.filter((item) => !item.isConfirmed).length;

  return (
    <Section>
      <Container size="narrow">
        <FaqJsonLd items={items} />

        <Eyebrow>Domande</Eyebrow>
        <h1 className="text-display mt-4">Quello che ci chiedete.</h1>
        <p className="text-lead text-cacao-soft mt-5">
          E, dove serve, quello che non possiamo ancora rispondere.
        </p>

        {unconfirmed > 0 && (
          <p className="border-warning bg-energy-wash text-cacao mt-8 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
            Alcune risposte portano il badge <strong>Da confermare</strong>. Riguardano ricetta,
            allergeni e conservazione: sono in attesa delle analisi di laboratorio e della
            chiusura della formulazione. Preferiamo dirlo che inventare un numero.
          </p>
        )}

        {groups.map((group) => (
          <section key={group} className="mt-14" aria-labelledby={`faq-${group}`}>
            <h2 id={`faq-${group}`} className="text-title">
              {GROUP_LABELS[group] ?? group}
            </h2>
            <FaqAccordion items={items.filter((item) => item.group === group)} className="mt-6" />
          </section>
        ))}

        <div className="rounded-card bg-crema grain mt-16 p-7 sm:p-8">
          <h2 className="text-title">Non hai trovato la risposta?</h2>
          <p className="text-cacao-soft mt-3 leading-relaxed">
            Scrivici: rispondiamo noi, non un modulo automatico.
          </p>
          <Link
            href="/contatti"
            className="hover:text-fiamma mt-4 inline-block font-semibold underline underline-offset-4"
          >
            {BRAND_LEGAL.email}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
