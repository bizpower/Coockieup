import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CookieShape } from "@/components/brand/CookieShape";
import { COOKIE_SHAPES, SHAPE_LABELS } from "@/config/brand";
import type { ContentValue } from "@/services/content";

/**
 * Il rimando a "Il nostro biscotto".
 *
 * Quella pagina esisteva senza che niente, dalla home, ci portasse: si poteva
 * raggiungere solo dal menu. Questa sezione racconta il perché delle tre forme
 * quel tanto che basta a far venire voglia di leggere il resto, e mostra le
 * forme stesse — che sono l'argomento, quindi vale la pena vederle prima di
 * leggerne.
 */
export function StoryTeaser({
  content,
}: {
  content: ContentValue<"storyTeaser">;
}) {
  return (
    <Section tone="crema" aria-labelledby="storia-titolo">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 id="storia-titolo" className="text-display mt-4">
              {content.title}
            </h2>
            <p className="text-lead text-cacao-soft mt-5">{content.body}</p>
            <ButtonLink
              href="/il-nostro-biscotto"
              variant="outline"
              className="mt-8"
            >
              {content.ctaLabel}
              <ArrowRightIcon />
            </ButtonLink>
          </div>

          <ul className="flex items-center justify-center gap-6 sm:gap-10">
            {COOKIE_SHAPES.map((shape) => (
              <li key={shape} className="flex-1 text-center">
                {/* Senza `title` la forma è decorativa: l'etichetta sotto la
                    nomina già, e ripeterla sarebbe rumore per chi ascolta. */}
                <CookieShape
                  shape={shape}
                  className="mx-auto w-full max-w-[7.5rem]"
                />
                <span className="eyebrow text-cacao-soft mt-4 block">
                  {SHAPE_LABELS[shape]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
