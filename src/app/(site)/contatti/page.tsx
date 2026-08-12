import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_LEGAL, BRAND_SOCIAL } from "@/config/brand";
import { CookieShape } from "@/components/brand/CookieShape";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Come raggiungerci: ordini, collaborazioni, stampa.",
  alternates: { canonical: "/contatti" },
};

const CHANNELS = [
  {
    shape: "life" as const,
    title: "Il tuo ordine",
    body: "Problemi con una consegna, un reso o un pagamento. Indica il numero d'ordine: fa risparmiare un giro di email.",
    email: BRAND_LEGAL.supportEmail,
  },
  {
    shape: "energy" as const,
    title: "Tutto il resto",
    body: "Domande sul prodotto, proposte, curiosità. Leggiamo tutto, rispondiamo quasi a tutto.",
    email: BRAND_LEGAL.email,
  },
  {
    shape: "potion" as const,
    title: "Stampa e collaborazioni",
    body: "Materiali, immagini, campioni. Scrivici cosa stai preparando e ti mandiamo quello che serve.",
    email: BRAND_LEGAL.email,
  },
];

export default function ContactPage() {
  return (
    <Section>
      <Container>
        <Eyebrow>Contatti</Eyebrow>
        <h1 className="text-display mt-4 max-w-3xl">Ci trovi qui.</h1>
        <p className="text-lead text-cacao-soft mt-5 max-w-2xl">
          Siamo un progetto giovane: dall&apos;altra parte c&apos;è una persona, non un
          centralino. Rispondiamo in giornata nei giorni lavorativi.
        </p>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <li key={channel.title}>
              <article className="border-cacao-line rounded-card flex h-full flex-col border p-7">
                <CookieShape shape={channel.shape} className="w-14" />
                <h2 className="mt-5 text-xl font-extrabold tracking-tight">{channel.title}</h2>
                <p className="text-cacao-soft mt-2.5 flex-1 text-[0.9375rem] leading-relaxed">
                  {channel.body}
                </p>
                <a
                  href={`mailto:${channel.email}`}
                  className="hover:text-fiamma mt-5 font-semibold underline underline-offset-4 transition-colors"
                >
                  {channel.email}
                </a>
              </article>
            </li>
          ))}
        </ul>

        <div className="border-cacao-line mt-14 grid gap-10 border-t pt-10 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Sui social</h2>
            <ul className="mt-3 flex gap-4">
              {Object.entries(BRAND_SOCIAL).map(([name, href]) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="hover:text-fiamma font-semibold underline underline-offset-4 capitalize transition-colors"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Dati societari</h2>
            <address className="text-cacao-soft mt-3 text-sm leading-relaxed not-italic">
              {BRAND_LEGAL.companyName}
              <br />
              {BRAND_LEGAL.address}
              <br />
              P. IVA {BRAND_LEGAL.vatId}
            </address>
            <p className="text-cacao-soft mt-3 text-xs">
              Dati in fase di registrazione: verranno completati prima dell&apos;apertura
              degli ordini.
            </p>
          </div>
        </div>

        <p className="text-cacao-soft mt-12 text-sm">
          Cerchi un ordine già fatto?{" "}
          <Link href="/account" className="hover:text-fiamma underline underline-offset-4">
            Lo ritrovi qui
          </Link>{" "}
          con numero ed email.
        </p>
      </Container>
    </Section>
  );
}
