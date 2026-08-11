import { COOKIE_SHAPES } from "@/config/brand";
import { CookieShape } from "@/components/brand/CookieShape";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import type { ContentValue } from "@/services/content";

/**
 * Scegli → Apri → Sgranocchia.
 *
 * Le tre forme fanno da numeri di passo: è il modo più diretto per far entrare
 * la firma visiva del brand in una sezione che altrove sarebbe tre icone grigie.
 */
export function HowItWorks({ content }: { content: ContentValue<"howItWorks"> }) {
  return (
    <Section tone="cacao" aria-labelledby="come-funziona-titolo">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow className="text-energy">{content.eyebrow}</Eyebrow>
          <h2 id="come-funziona-titolo" className="text-display mt-4">
            {content.title}
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {content.steps.map((step, index) => (
            <li key={step.label} className="flex gap-5 md:block">
              <div className="w-16 shrink-0 md:w-20">
                <CookieShape shape={COOKIE_SHAPES[index % COOKIE_SHAPES.length]!} />
              </div>
              <div className="md:mt-6">
                <h3 className="text-title">
                  <span className="text-panna/40 mr-2 text-2xl align-top">
                    {index + 1}
                  </span>
                  {step.label}
                </h3>
                <p className="text-panna/70 mt-2.5 text-[0.9375rem] leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
