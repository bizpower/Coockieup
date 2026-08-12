import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COOKIE_SHAPES, type CookieShapeKey } from "@/config/brand";
import { CookieShape } from "@/components/brand/CookieShape";
import { PackShot } from "@/components/brand/PackShot";
import { BuyBox } from "@/components/commerce/BuyBox";
import { NutritionTable } from "@/components/commerce/NutritionTable";
import { BreadcrumbJsonLd, FaqJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import { PageViewTracker } from "@/components/seo/PageViewTracker";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Badge } from "@/components/ui/Badge";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { db } from "@/lib/db";
import { getPublishedReviews, getRatingSummary } from "@/services/catalog";
import { getContent } from "@/services/content";

function isShapeKey(value: string): value is CookieShapeKey {
  return (COOKIE_SHAPES as readonly string[]).includes(value);
}

async function loadProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      flavors: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      nutrition: { orderBy: { sortOrder: "asc" } },
      ingredients: { orderBy: { sortOrder: "asc" } },
      allergens: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Prodotto non trovato" };

  return {
    title: product.seoTitle ?? product.name,
    description: product.metaDescription ?? product.description.slice(0, 155),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.metaDescription ?? product.description.slice(0, 155),
      type: "website",
    },
  };
}

/**
 * Scheda prodotto.
 *
 * Il blocco d'acquisto è l'unica isola client della pagina: tutto il resto —
 * descrizione, ingredienti, tabella nutrizionale, recensioni, FAQ — è HTML
 * renderizzato sul server, quindi indicizzabile e leggibile senza JavaScript.
 */
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variante?: string }>;
}) {
  const [{ slug }, { variante }] = await Promise.all([params, searchParams]);
  const product = await loadProduct(slug);
  if (!product) notFound();

  const [reviews, socialProof, faqs, shippingRate, rating] = await Promise.all([
    getPublishedReviews(product.id, 3),
    getContent("socialProof"),
    db.faqItem.findMany({
      where: { isPublished: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
      take: 6,
    }),
    db.shippingRate.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    // Solo recensioni reali: vedi la nota in ProductJsonLd.
    getRatingSummary(product.id),
  ]);

  const recipeInProgress = product.ingredients.some((i) => !i.isConfirmed);

  const cheapest = product.variants.reduce<(typeof product.variants)[number] | undefined>(
    (best, variant) => (!best || variant.priceCents < best.priceCents ? variant : best),
    undefined,
  );

  return (
    <>
      <PageViewTracker path={`/product/${product.slug}`} />

      {cheapest && (
        <ProductJsonLd
          name={product.name}
          description={product.metaDescription ?? product.description}
          slug={product.slug}
          sku={cheapest.sku}
          priceCents={cheapest.priceCents}
          inStock={product.variants.some((variant) => variant.stock > 0)}
          rating={rating}
        />
      )}

      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.name, path: `/product/${product.slug}` },
        ]}
      />

      <FaqJsonLd items={faqs} />
      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <Container>
          <nav aria-label="Percorso" className="text-cacao-soft mb-8 text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-fiamma underline-offset-4 hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/shop" className="hover:text-fiamma underline-offset-4 hover:underline">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-cacao font-medium">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Galleria: il pack grande, i tre biscotti sotto. Sostituire questi
                vettori con le fotografie è documentato in docs/PHOTO-BRIEF.md. */}
            <div>
              <div className="bg-crema rounded-card grain p-8 sm:p-12">
                <PackShot />
              </div>

              <ul className="mt-4 grid grid-cols-3 gap-4">
                {product.flavors.map((flavor) => (
                  <li
                    key={flavor.id}
                    className="rounded-card flex flex-col items-center p-4"
                    style={{ backgroundColor: flavor.washHex }}
                  >
                    {isShapeKey(flavor.shapeKey) && (
                      <CookieShape shape={flavor.shapeKey} className="w-14" />
                    )}
                    <span className="mt-3 text-center text-xs font-bold">{flavor.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h1 className="text-display">{product.name}</h1>
              {product.subtitle && (
                <p className="text-lead text-cacao-soft mt-3">{product.subtitle}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {product.flavors.map((flavor) => (
                  <Badge key={flavor.id} tone="outline">
                    {flavor.name}
                  </Badge>
                ))}
              </div>

              <p className="text-cacao-soft mt-6 leading-relaxed">{product.description}</p>

              <div className="mt-8">
                <BuyBox
                  variants={product.variants.map((v) => ({
                    id: v.id,
                    sku: v.sku,
                    name: v.name,
                    boxCount: v.boxCount,
                    priceCents: v.priceCents,
                    compareAtCents: v.compareAtCents,
                    stock: v.stock,
                    badge: v.badge,
                    isDefault: v.isDefault,
                  }))}
                  productName={product.name}
                  unitsPerBox={product.unitsPerBox}
                  initialSku={variante}
                />
              </div>

              {shippingRate && (
                <dl className="border-cacao-line mt-8 space-y-2.5 border-t pt-6 text-sm">
                  <div className="flex gap-3">
                    <dt className="text-cacao-soft w-28 shrink-0">Spedizione</dt>
                    <dd>
                      {shippingRate.name}
                      {shippingRate.estimateDays && ` · ${shippingRate.estimateDays}`}
                      {shippingRate.freeOverCents !== null && (
                        <>
                          {" "}
                          — gratuita sopra i{" "}
                          {(shippingRate.freeOverCents / 100).toFixed(2).replace(".", ",")} €
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="text-cacao-soft w-28 shrink-0">Resi</dt>
                    <dd>
                      <Link
                        href="/legal/resi-e-rimborsi"
                        className="hover:text-fiamma underline underline-offset-4"
                      >
                        Come funzionano
                      </Link>
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="dettagli-titolo">
        <Container>
          <h2 id="dettagli-titolo" className="sr-only">
            Dettagli del prodotto
          </h2>

          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <Eyebrow>Ingredienti</Eyebrow>
              <h3 className="text-title mt-3">Cosa c&apos;è dentro</h3>

              {recipeInProgress && (
                <p className="border-fiamma bg-fiamma-wash text-cacao mt-5 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
                  Ricetta in sviluppo. Questa è la direzione di lavoro, non la
                  formulazione definitiva: l&apos;elenco in etichetta potrà differire.
                </p>
              )}

              <ul className="border-cacao-line mt-6 border-t">
                {product.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="border-cacao-line flex items-baseline justify-between gap-6 border-b py-3.5"
                  >
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.note && (
                      <span className="text-cacao-soft max-w-[14rem] text-right text-sm">
                        {ingredient.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow>Valori</Eyebrow>
              <h3 className="text-title mt-3">Tabella nutrizionale</h3>
              <div className="mt-6">
                <NutritionTable facts={product.nutrition} allergens={product.allergens} />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <SocialProof content={socialProof} reviews={reviews} />

      <Section aria-labelledby="faq-prodotto-titolo">
        <Container size="narrow">
          <Eyebrow>Domande</Eyebrow>
          <h2 id="faq-prodotto-titolo" className="text-display mt-4">
            Prima che tu lo chieda.
          </h2>
          <FaqAccordion items={faqs} className="mt-10" />
        </Container>
      </Section>
    </>
  );
}
