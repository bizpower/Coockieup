import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { db } from "@/lib/db";

/**
 * Sitemap generata dal database.
 *
 * Contiene solo quello che è davvero pubblico e indicizzabile: niente
 * carrello, niente cassa, niente area amministrativa, niente pagine legali
 * ancora in bozza. Una sitemap che elenca pagine con `noindex` manda a Google
 * due istruzioni contraddittorie.
 *
 * Viene prerenderizzata in fase di build, quindi tocca il database mentre il
 * progetto compila. Se il database non è raggiungibile — succede al primo
 * deploy, quando le migrazioni non sono ancora state applicate — la sitemap
 * ricade sulle sole pagine statiche invece di far fallire l'intera build.
 * Alla prima rivalidazione si ripopola da sola.
 */

export const revalidate = 3600;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${SITE_URL}/shop`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${SITE_URL}/il-nostro-biscotto`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/ingredienti`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/magazine`, changeFrequency: "daily", priority: 0.8 },
  { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/contatti`, changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await buildSitemap();
  } catch (error) {
    console.warn(
      "Sitemap: database non raggiungibile, includo solo le pagine statiche.",
      error instanceof Error ? error.message : error,
    );
    return STATIC_PAGES;
  }
}

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [products, posts, categories, legalPages] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    }),
    db.post.findMany({
      where: {
        OR: [
          { status: "PUBLISHED", publishedAt: { lte: now } },
          { status: "SCHEDULED", scheduledFor: { lte: now } },
        ],
      },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({ select: { slug: true } }),
    // Le bozze in attesa di revisione legale sono servite con noindex.
    db.legalPage.findMany({
      where: { needsLegalReview: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...STATIC_PAGES,
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/magazine/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/magazine/categoria/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...legalPages.map((page) => ({
      url: `${SITE_URL}/legal/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
