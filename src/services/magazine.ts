import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Lettura del magazine.
 *
 * Un articolo è pubblico se è PUBLISHED **e** la sua data di pubblicazione è
 * passata. La seconda condizione conta: un pezzo programmato per domani non
 * deve comparire oggi, e senza un lavoro schedulato che cambi lo stato,
 * l'unico modo per garantirlo è filtrarlo qui a ogni lettura.
 *
 * Gli articoli SCHEDULED diventano visibili da soli quando arriva la loro ora,
 * senza che nessuno debba tornare a premere "pubblica".
 */

function publicFilter() {
  const now = new Date();
  return {
    OR: [
      { status: "PUBLISHED" as const, publishedAt: { lte: now } },
      { status: "SCHEDULED" as const, scheduledFor: { lte: now } },
    ],
  };
}

const POST_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  scheduledFor: true,
  readingMinutes: true,
  featuredImageAlt: true,
  category: { select: { slug: true, name: true, colorHex: true } },
  featuredImage: { select: { url: true, alt: true } },
} as const;

export const getPublishedPosts = cache(
  async ({
    take = 12,
    skip = 0,
    categorySlug,
    tagSlug,
    excludeId,
  }: {
    take?: number;
    skip?: number;
    categorySlug?: string;
    tagSlug?: string;
    excludeId?: string;
  } = {}) => {
    return db.post.findMany({
      where: {
        ...publicFilter(),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { scheduledFor: "desc" }],
      take,
      skip,
      select: POST_CARD_SELECT,
    });
  },
);

export const countPublishedPosts = cache(
  async ({ categorySlug, tagSlug }: { categorySlug?: string; tagSlug?: string } = {}) => {
    return db.post.count({
      where: {
        ...publicFilter(),
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
      },
    });
  },
);

export const getPostBySlug = cache(async (slug: string) => {
  return db.post.findFirst({
    where: { slug, ...publicFilter() },
    include: {
      category: true,
      tags: true,
      author: { select: { name: true, bio: true, avatarUrl: true } },
      featuredImage: true,
    },
  });
});

export const getCategories = cache(async () => {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: { where: publicFilter() } } } },
  });
});

/**
 * Articoli correlati: prima quelli della stessa categoria, poi i più recenti
 * a completare. Un blocco "leggi anche" con un solo pezzo dentro sembra un
 * errore, quindi si riempie sempre.
 */
export const getRelatedPosts = cache(async (postId: string, categorySlug?: string, take = 3) => {
  const sameCategory = categorySlug
    ? await getPublishedPosts({ categorySlug, excludeId: postId, take })
    : [];

  if (sameCategory.length >= take) return sameCategory;

  const others = await db.post.findMany({
    where: {
      ...publicFilter(),
      NOT: { id: { in: [postId, ...sameCategory.map((post) => post.id)] } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: take - sameCategory.length,
    select: POST_CARD_SELECT,
  });

  return [...sameCategory, ...others];
});

export type PostCard = Awaited<ReturnType<typeof getPublishedPosts>>[number];

/** La data da mostrare: pubblicazione effettiva o programmata già scattata. */
export function postDate(post: { publishedAt: Date | null; scheduledFor: Date | null }): Date | null {
  return post.publishedAt ?? post.scheduledFor;
}
