import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookieShape } from "@/components/brand/CookieShape";
import { PackShot } from "@/components/brand/PackShot";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ButtonLink } from "@/components/ui/Button";
import { UnconfirmedBadge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { COOKIE_SHAPES, type CookieShapeKey } from "@/config/brand";
import { getFeaturedProduct } from "@/services/catalog";
import { getContent } from "@/services/content";

export const metadata: Metadata = {
  title: "Il nostro biscotto",
  description:
    "Perché tre forme, perché il formato mini, come nasce la ricetta. La storia del prodotto raccontata senza slogan.",
  alternates: { canonical: "/il-nostro-biscotto" },
};

function isShapeKey(value: string): value is CookieShapeKey {
  return (COOKIE_SHAPES as readonly string[]).includes(value);
}

const CHAPTERS = [
  {
    title: "Siamo partiti dalle quattro del pomeriggio",
    body: "Non da un obiettivo nutrizionale. Dal momento della giornata in cui hai fame, hai poco tempo e quello che trovi in giro è o troppo o sbagliato. Un biscotto da otto grammi ci sta dentro. Una barretta da sessanta, spesso, no.",
  },
  {
    title: "Le forme vengono dai power-up",
    body: "Cuore, fulmine, ampolla: sono i tre simboli che chiunque abbia giocato a qualcosa riconosce senza doverli spiegare. Ci piaceva l'idea che un biscotto potesse essere anche una piccola citazione, purché restasse un biscotto vero — con la crosta, le gocce e i bordi irregolari.",
  },
  {
    title: "Il gusto viene prima della dichiarazione",
    body: "La regola che ci siamo dati è una sola: se una ricetta non la rimangeresti senza sapere che è proteica, quella ricetta non esce dal laboratorio. Il numero sull'etichetta è una conseguenza, non il punto di partenza.",
  },
  {
    title: "Non diciamo quello che non sappiamo",
    body: "Ricetta, valori nutrizionali e allergeni sono in fase di validazione. Finché non abbiamo i risultati delle analisi, su questo sito ogni dato non confermato porta un badge che lo dice. È meno comodo di scrivere un numero tondo, ma è l'unico modo onesto di aprire un progetto alimentare.",
  },
];

export default async function OurCookiePage() {
  const [product, howItWorks] = await Promise.all([
    getFeaturedProduct(),
    getContent("howItWorks"),
  ]);

  if (!product) notFound();

  const highlights = product.nutrition.filter((fact) => fact.isHighlight);

  return (
    <>
      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow>Il prodotto</Eyebrow>
              <h1 className="text-display mt-4">
                Un biscotto piccolo,
                <br />
                pensato in grande.
              </h1>
              <p className="text-lead text-cacao-soft mt-5 max-w-xl">
                {product.unitsPerBox} mini cookie, tre forme, tre gusti. Sotto, il ragionamento
                che c&apos;è dietro — e le cose che ancora non sappiamo.
              </p>
              <ButtonLink href={`/product/${product.slug}`} size="lg" className="mt-8">
                Vai al box
                <ArrowRightIcon />
              </ButtonLink>
            </div>

            <div className="mx-auto w-full max-w-[18rem] lg:max-w-none">
              <PackShot />
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="capitoli-titolo">
        <Container>
          <h2 id="capitoli-titolo" className="sr-only">
            Come nasce il prodotto
          </h2>

          <ol className="grid gap-x-10 gap-y-14 sm:grid-cols-2">
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.title}>
                <span
                  className="font-display text-crema-deep block text-6xl leading-none font-extrabold"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-title mt-3">{chapter.title}</h3>
                <p className="text-cacao-soft mt-3 leading-relaxed">{chapter.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="crema" aria-labelledby="forme-titolo">
        <Container>
          <Eyebrow>Le tre forme</Eyebrow>
          <h2 id="forme-titolo" className="text-display mt-4">
            Cuore, fulmine, ampolla.
          </h2>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {product.flavors.map((flavor) => (
              <li key={flavor.id}>
                <article className="bg-panna rounded-card flex h-full flex-col p-7">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold uppercase"
                      style={{ backgroundColor: flavor.washHex, color: flavor.colorHex }}
                    >
                      {flavor.shapeLabel}
                    </span>
                  </div>
                  {isShapeKey(flavor.shapeKey) && (
                    <div className="my-7 flex justify-center">
                      <CookieShape shape={flavor.shapeKey} className="w-28" />
                    </div>
                  )}
                  <h3 className="text-xl font-extrabold tracking-tight">{flavor.name}</h3>
                  <p className="text-cacao-soft mt-2.5 text-[0.9375rem] leading-relaxed">
                    {flavor.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {highlights.length > 0 && (
        <Section aria-labelledby="numeri-titolo">
          <Container>
            <h2 id="numeri-titolo" className="text-title">
              I numeri, per quello che valgono oggi
            </h2>

            <dl className="border-cacao-line mt-8 grid gap-8 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((fact) => (
                <div key={fact.id}>
                  <dt className="text-cacao-soft text-sm font-semibold">{fact.label}</dt>
                  <dd className="font-display mt-1 text-4xl font-extrabold tracking-tight">
                    {fact.value}
                    {fact.unit && <span className="text-2xl"> {fact.unit}</span>}
                  </dd>
                  <p className="text-cacao-soft mt-1 text-xs">{fact.basis}</p>
                  {!fact.isConfirmed && <UnconfirmedBadge className="mt-2.5" />}
                </div>
              ))}
            </dl>

            <p className="text-cacao-soft mt-8 max-w-2xl text-sm leading-relaxed">
              Sono obiettivi di formulazione. Diventano dati di etichetta quando la ricetta è
              chiusa e il laboratorio ci restituisce le analisi — non prima, e non perché fa
              comodo al lancio.
            </p>
          </Container>
        </Section>
      )}

      <HowItWorks content={howItWorks} />
    </>
  );
}
