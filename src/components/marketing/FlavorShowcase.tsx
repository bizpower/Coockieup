import type { Flavor } from "@prisma/client";
import { COOKIE_SHAPES, type CookieShapeKey } from "@/config/brand";
import { CookieShape } from "@/components/brand/CookieShape";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import type { ContentValue } from "@/services/content";

/**
 * I tre gusti.
 *
 * Colori e forme arrivano dal database: un quarto gusto è una riga inserita
 * dall'admin e questa griglia lo mostra da sola. Il colore del gusto è
 * applicato inline perché è un dato, non una classe: Tailwind non può generare
 * a build time una tinta scelta a runtime.
 */

function isShapeKey(value: string): value is CookieShapeKey {
  return (COOKIE_SHAPES as readonly string[]).includes(value);
}

export function FlavorShowcase({
  flavors,
  content,
  unitsPerBox,
}: {
  flavors: Flavor[];
  content: ContentValue<"productSection">;
  unitsPerBox: number;
}) {
  return (
    <Section tone="crema" id="gusti" aria-labelledby="gusti-titolo">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="gusti-titolo" className="text-display mt-4">
            {content.title}
          </h2>
          <p className="text-lead text-cacao-soft mt-5">{content.body}</p>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {flavors.map((flavor, index) => (
            <li key={flavor.id}>
              <Reveal delay={index * 90}>
                <article
                  className="rounded-card grain flex h-full flex-col p-7 sm:p-8"
                  style={{ backgroundColor: flavor.washHex }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Badge tone="dark">{flavor.shapeLabel}</Badge>
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: flavor.colorHex }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="my-8 flex justify-center">
                    {isShapeKey(flavor.shapeKey) && (
                      <CookieShape
                        shape={flavor.shapeKey}
                        className="w-32 transition-transform duration-500 ease-[var(--ease-out-soft)] hover:-rotate-6 sm:w-36"
                      />
                    )}
                  </div>

                  <h3 className="text-title">{flavor.name}</h3>
                  <p className="text-cacao-soft mt-3 text-[0.9375rem] leading-relaxed">
                    {flavor.description}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <p className="text-cacao-soft mt-10 text-sm">
          Ogni confezione contiene {unitsPerBox} mini cookie, con tutti e{" "}
          {flavors.length} i gusti dentro. Non si sceglie: si prende tutto.
        </p>
      </Container>
    </Section>
  );
}
