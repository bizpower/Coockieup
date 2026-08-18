import type { Metadata } from "next";
import { BundleTeaser } from "@/components/marketing/BundleTeaser";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductListJsonLd } from "@/components/seo/JsonLd";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Mini cookie proteici in tre gusti. Scegli il formato: un box per provare, tre o sei per non restare a secco.",
  alternates: { canonical: "/shop" },
};

/**
 * Shop.
 *
 * Con un solo prodotto a catalogo la griglia sarebbe una card sola in mezzo al
 * vuoto: la pagina mostra i formati per esteso e tiene la griglia sotto, che
 * si popola da sola quando arrivano le barrette o le limited edition.
 */
export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const hero = products[0];

  return (
    <>
      {hero && hero.variants.length > 0 && (
        <ProductListJsonLd
          items={hero.variants.map((variante) => ({
            name: `${hero.name} — ${variante.name}`,
            slug: hero.slug,
            priceCents: variante.priceCents,
            sku: variante.sku,
          }))}
        />
      )}

      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <Container>
          <Eyebrow>Shop</Eyebrow>
          <h1 className="text-display mt-4 max-w-3xl">
            Tutto quello che c&apos;è. Che per ora è una cosa sola, ma fatta
            bene.
          </h1>
          <p className="text-lead text-cacao-soft mt-5 max-w-2xl">
            Un box da 15 mini cookie con tutti e tre i gusti dentro. La
            differenza tra i formati è quanti ne tieni in casa.
          </p>
        </Container>
      </Section>

      {hero && (
        <BundleTeaser variants={hero.variants} productSlug={hero.slug} />
      )}

      {products.length > 1 && (
        <Section tone="crema" aria-labelledby="catalogo-titolo">
          <Container>
            <h2 id="catalogo-titolo" className="text-display">
              Tutto il catalogo
            </h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    slug={product.slug}
                    name={product.name}
                    subtitle={product.subtitle}
                    variants={product.variants}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
