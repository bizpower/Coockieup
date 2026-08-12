import { BRAND_LEGAL, BRAND_NAME, BRAND_SOCIAL, BRAND_TAGLINE } from "@/config/brand";
import { CURRENCY, SITE_URL } from "@/config/site";

/**
 * Dati strutturati.
 *
 * Regola che vale per tutti i componenti qui dentro: **si dichiara solo quello
 * che è vero**. Niente `aggregateRating` costruito su recensioni di esempio,
 * nessuna disponibilità dichiarata per un prodotto esaurito, nessuna data di
 * pubblicazione inventata. Un dato strutturato falso è una dichiarazione a
 * Google, e si paga con una penalizzazione manuale.
 *
 * `JSON.stringify` con escape di `<` impedisce a un contenuto che contenga
 * "</script>" di uscire dal tag e diventare markup eseguibile.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: BRAND_NAME,
            description: BRAND_TAGLINE,
            url: SITE_URL,
            email: BRAND_LEGAL.email,
            sameAs: Object.values(BRAND_SOCIAL),
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: BRAND_NAME,
            url: SITE_URL,
            inLanguage: "it-IT",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
        ],
      }}
    />
  );
}

export function ProductJsonLd({
  name,
  description,
  slug,
  sku,
  priceCents,
  inStock,
  rating,
  imageUrl,
}: {
  name: string;
  description: string;
  slug: string;
  sku: string;
  priceCents: number;
  inStock: boolean;
  /** Solo da recensioni reali pubblicate. Null se non ce ne sono. */
  rating: { average: number; count: number } | null;
  imageUrl?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        sku,
        brand: { "@type": "Brand", name: BRAND_NAME },
        url: `${SITE_URL}/product/${slug}`,
        ...(imageUrl ? { image: [`${SITE_URL}${imageUrl}`] } : {}),
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${slug}`,
          priceCurrency: CURRENCY.code,
          price: (priceCents / 100).toFixed(2),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@id": `${SITE_URL}/#organization` },
        },
        // Presente solo con recensioni vere: vedi la nota in cima al file.
        ...(rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.average.toFixed(1),
                reviewCount: rating.count,
              },
            }
          : {}),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  authorName,
  imageUrl,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date;
  authorName?: string;
  imageUrl?: string | null;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: `${SITE_URL}/magazine/${slug}`,
        mainEntityOfPage: `${SITE_URL}/magazine/${slug}`,
        ...(publishedAt ? { datePublished: publishedAt.toISOString() } : {}),
        dateModified: updatedAt.toISOString(),
        ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
        publisher: { "@id": `${SITE_URL}/#organization` },
        ...(imageUrl ? { image: [`${SITE_URL}${imageUrl}`] } : {}),
        inLanguage: "it-IT",
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      }}
    />
  );
}

/**
 * FAQ strutturate.
 *
 * Le risposte non confermate vengono escluse: dichiararle a Google come
 * risposte ufficiali significherebbe pubblicare come certo ciò che sul sito
 * è esplicitamente marcato come da confermare.
 */
export function FaqJsonLd({
  items,
}: {
  items: { question: string; answer: string; isConfirmed: boolean }[];
}) {
  const confirmed = items.filter((item) => item.isConfirmed);
  if (confirmed.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: confirmed.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }}
    />
  );
}
