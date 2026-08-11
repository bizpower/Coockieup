import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Accesso al catalogo.
 *
 * Le funzioni sono avvolte in `cache()` di React: dentro una stessa richiesta
 * la home può chiedere il prodotto da tre sezioni diverse e la query parte una
 * volta sola. Nessun prop drilling di dati dal layout.
 */

/** Il prodotto di lancio, con tutto quello che serve a costruirne le pagine. */
export const getFeaturedProduct = cache(async () => {
  return db.product.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      images: { orderBy: { sortOrder: "asc" } },
      flavors: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      nutrition: { orderBy: { sortOrder: "asc" } },
      ingredients: { orderBy: { sortOrder: "asc" } },
      allergens: { orderBy: { sortOrder: "asc" } },
    },
  });
});

export type FeaturedProduct = NonNullable<Awaited<ReturnType<typeof getFeaturedProduct>>>;

export const getFlavors = cache(async () => {
  return db.flavor.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});

/** Recensioni pubblicate. Le demo restano incluse ma segnalate. */
export const getPublishedReviews = cache(async (productId: string, take = 6) => {
  return db.review.findMany({
    where: { productId, isPublished: true },
    orderBy: { createdAt: "desc" },
    take,
  });
});

/**
 * Media e conteggio delle recensioni.
 *
 * Le recensioni marcate `isDemo` sono escluse: alimentare l'AggregateRating di
 * schema.org con valutazioni inventate significa dichiarare a Google un dato
 * falso, ed è il tipo di scorciatoia che costa una penalizzazione.
 */
export const getRatingSummary = cache(async (productId: string) => {
  const result = await db.review.aggregate({
    where: { productId, isPublished: true, isDemo: false },
    _avg: { rating: true },
    _count: true,
  });

  if (result._count === 0 || result._avg.rating === null) return null;
  return { average: result._avg.rating, count: result._count };
});

export const getFaqs = cache(async (group?: string) => {
  return db.faqItem.findMany({
    where: { isPublished: true, ...(group ? { group } : {}) },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });
});

export const getActiveShippingRate = cache(async () => {
  return db.shippingRate.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});
