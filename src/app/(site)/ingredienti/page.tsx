import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookieShape } from "@/components/brand/CookieShape";
import { NutritionTable } from "@/components/commerce/NutritionTable";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { COOKIE_SHAPES, type CookieShapeKey } from "@/config/brand";
import { getFeaturedProduct } from "@/services/catalog";
import { getContent } from "@/services/content";

export const metadata: Metadata = {
  title: "Ingredienti",
  description:
    "Cosa c'è dentro i nostri mini cookie proteici: la lista degli ingredienti, i valori nutrizionali e gli allergeni, con lo stato di validazione di ciascun dato.",
  alternates: { canonical: "/ingredienti" },
};

function isShapeKey(value: string): value is CookieShapeKey {
  return (COOKIE_SHAPES as readonly string[]).includes(value);
}

export default async function IngredientsPage() {
  const [product, content] = await Promise.all([
    getFeaturedProduct(),
    getContent("ingredientSection"),
  ]);

  if (!product) notFound();

  const recipeInProgress = product.ingredients.some((item) => !item.isConfirmed);

  return (
    <>
      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <Container>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h1 className="text-display mt-4 max-w-3xl">{content.title}</h1>
          <p className="text-lead text-cacao-soft mt-5 max-w-2xl">{content.body}</p>

          {recipeInProgress && (
            <p className="border-fiamma bg-fiamma-wash text-cacao mt-8 max-w-2xl border-l-4 px-5 py-4 leading-relaxed font-medium">
              {content.recipeNotice}
            </p>
          )}
        </Container>
      </Section>

      <Section aria-labelledby="lista-titolo">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 id="lista-titolo" className="text-title">
                La lista
              </h2>
              <ul className="border-cacao-line mt-8 border-t">
                {product.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="border-cacao-line flex items-baseline justify-between gap-6 border-b py-4"
                  >
                    <span className="font-display text-xl font-bold tracking-tight">
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

              <p className="text-cacao-soft mt-6 text-sm leading-relaxed">
                L&apos;elenco definitivo, con le percentuali e l&apos;ordine di peso previsti
                dalla normativa, sarà quello riportato in etichetta a formulazione chiusa.
              </p>
            </div>

            <div>
              <h2 className="text-title">Valori e allergeni</h2>
              <div className="mt-8">
                <NutritionTable facts={product.nutrition} allergens={product.allergens} />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="crema" aria-labelledby="gusti-ingredienti-titolo">
        <Container>
          <h2 id="gusti-ingredienti-titolo" className="text-display">
            Cosa cambia fra i tre gusti
          </h2>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {product.flavors.map((flavor) => (
              <li key={flavor.id}>
                <article
                  className="rounded-card flex h-full flex-col p-7"
                  style={{ backgroundColor: flavor.washHex }}
                >
                  {isShapeKey(flavor.shapeKey) && (
                    <CookieShape shape={flavor.shapeKey} className="w-20" />
                  )}
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight">{flavor.name}</h3>
                  <p className="text-cacao-soft mt-2.5 text-[0.9375rem] leading-relaxed">
                    {flavor.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href={`/product/${product.slug}`}>
              Vedi il box
              <ArrowRightIcon />
            </ButtonLink>
            <ButtonLink href="/faq" variant="outline">
              Domande frequenti
            </ButtonLink>
          </div>

          <p className="text-cacao-soft mt-8 text-sm">
            Hai un&apos;allergia o un&apos;intolleranza?{" "}
            <Link href="/contatti" className="hover:text-fiamma underline underline-offset-4">
              Scrivici prima di ordinare
            </Link>
            : ti diciamo quello che sappiamo con certezza, e quello che non sappiamo ancora.
          </p>
        </Container>
      </Section>
    </>
  );
}
