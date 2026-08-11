import type { NutritionFact } from "@prisma/client";
import { UnconfirmedBadge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import type { ContentValue } from "@/services/content";

/**
 * I benefit, più la striscia dei valori in evidenza.
 *
 * I numeri arrivano dal database e portano con sé il proprio stato: finché
 * `isConfirmed` è false compaiono con il badge "Da confermare" e la nota che
 * spiega perché. È l'unico modo per mostrare un obiettivo di formulazione
 * senza farlo passare per un dato di etichetta.
 */
export function BenefitGrid({
  content,
  highlights,
}: {
  content: ContentValue<"benefits">;
  highlights: NutritionFact[];
}) {
  const anyUnconfirmed = highlights.some((fact) => !fact.isConfirmed);

  return (
    <Section aria-labelledby="benefit-titolo">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="benefit-titolo" className="text-display mt-4">
            {content.title}
          </h2>
        </div>

        {highlights.length > 0 && (
          <div className="border-cacao-line mt-12 border-y py-8">
            <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

            {anyUnconfirmed && (
              <p className="text-cacao-soft mt-8 max-w-2xl text-sm leading-relaxed">
                I valori con il badge sono obiettivi di formulazione, non dati di
                etichetta. Diventano definitivi quando la ricetta è chiusa e le
                analisi di laboratorio ce li restituiscono: fino ad allora restano
                segnalati così.
              </p>
            )}
          </div>
        )}

        <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <li key={item.key}>
              <Reveal delay={index * 80}>
                <span
                  className="font-display text-crema-deep block text-6xl leading-none font-extrabold"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight">{item.title}</h3>
                <p className="text-cacao-soft mt-2.5 text-[0.9375rem] leading-relaxed">
                  {item.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
