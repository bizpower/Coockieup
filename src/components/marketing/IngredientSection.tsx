import type { Ingredient } from "@prisma/client";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { ContentValue } from "@/services/content";

/**
 * Gli ingredienti, in chiaro.
 *
 * L'avviso "ricetta in sviluppo" apre la sezione e non è nascosto in fondo: se
 * la formulazione non è chiusa, chi legge deve saperlo prima di leggere la lista.
 */
export function IngredientSection({
  content,
  ingredients,
}: {
  content: ContentValue<"ingredientSection">;
  ingredients: Ingredient[];
}) {
  const recipeInProgress = ingredients.some((ingredient) => !ingredient.isConfirmed);

  return (
    <Section aria-labelledby="ingredienti-titolo">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 id="ingredienti-titolo" className="text-display mt-4">
              {content.title}
            </h2>
            <p className="text-lead text-cacao-soft mt-5">{content.body}</p>

            {recipeInProgress && (
              <p className="border-fiamma bg-fiamma-wash text-cacao mt-8 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
                {content.recipeNotice}
              </p>
            )}

            <ButtonLink href="/ingredienti" variant="outline" className="mt-8">
              Tutti gli ingredienti
              <ArrowRightIcon />
            </ButtonLink>
          </div>

          <ul className="border-cacao-line border-t">
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="border-cacao-line flex items-baseline justify-between gap-6 border-b py-5"
              >
                <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  {ingredient.name}
                </span>
                {ingredient.note && (
                  <span className="text-cacao-soft max-w-[16rem] text-right text-sm">
                    {ingredient.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
