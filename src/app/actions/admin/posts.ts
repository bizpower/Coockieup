"use server";

import { revalidatePath } from "next/cache";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import type { JSONContent } from "@tiptap/react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { analyzeContent, autoExcerpt } from "@/lib/editor";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { slugify, uniqueSlug } from "@/lib/slug";

/**
 * Salvataggio degli articoli.
 *
 * L'HTML viene generato **sul server** dal JSON dell'editor, non accettato dal
 * client. È l'unico modo per essere certi che quello che finisce nel database
 * corrisponda al documento salvato: un HTML inviato dal browser potrebbe
 * contenere qualsiasi cosa, indipendentemente da cosa mostra l'editor.
 */

const EXTENSIONS = [
  StarterKit,
  Link,
  ImageExtension,
  Table,
  TableRow,
  TableCell,
  TableHeader,
];

export type SaveResult = { ok: boolean; message: string; slug?: string; id?: string };

const schema = z.object({
  title: z.string().trim().min(3, "Il titolo è troppo corto.").max(180),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().max(320).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
  scheduledFor: z.string().optional(),
  categoryId: z.string().optional(),
  featuredImageId: z.string().optional(),
  featuredImageAlt: z.string().trim().max(200).optional(),
  focusKeyword: z.string().trim().max(80).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(180).optional(),
  canonicalUrl: z.string().trim().max(300).optional(),
  ogTitle: z.string().trim().max(90).optional(),
  ogDescription: z.string().trim().max(200).optional(),
  tags: z.string().trim().max(300).optional(),
});

export async function savePost(
  postId: string | null,
  contentJson: JSONContent,
  formData: FormData,
): Promise<SaveResult> {
  const session = await requireAdmin();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const data = parsed.data;

  if (data.status === "SCHEDULED" && !data.scheduledFor) {
    return { ok: false, message: "Un articolo programmato ha bisogno di una data." };
  }

  const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  if (data.status === "SCHEDULED" && scheduledFor && scheduledFor <= new Date()) {
    return { ok: false, message: "La data di pubblicazione deve essere nel futuro." };
  }

  const analysis = analyzeContent(contentJson, data.focusKeyword);

  if (analysis.wordCount === 0 && data.status === "PUBLISHED") {
    return { ok: false, message: "Non si può pubblicare un articolo vuoto." };
  }

  const html = sanitizeArticleHtml(generateHTML(contentJson, EXTENSIONS));

  const slug = await uniqueSlug(data.slug || data.title, async (candidate) => {
    const existing = await db.post.findUnique({ where: { slug: candidate } });
    return Boolean(existing) && existing?.id !== postId;
  });

  const existing = postId ? await db.post.findUnique({ where: { id: postId } }) : null;

  const payload = {
    title: data.title,
    slug,
    excerpt: data.excerpt || autoExcerpt(contentJson),
    status: data.status,
    contentJson: contentJson as object,
    contentHtml: html,
    // La data di pubblicazione si fissa la prima volta che l'articolo esce e
    // non cambia più: aggiornarla a ogni salvataggio farebbe risalire in cima
    // al magazine un pezzo vecchio per una correzione di refuso.
    publishedAt:
      data.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
    scheduledFor: data.status === "SCHEDULED" ? scheduledFor : null,
    categoryId: data.categoryId || null,
    featuredImageId: data.featuredImageId || null,
    featuredImageAlt: data.featuredImageAlt || null,
    focusKeyword: data.focusKeyword || null,
    seoTitle: data.seoTitle || null,
    metaDescription: data.metaDescription || null,
    canonicalUrl: data.canonicalUrl || null,
    ogTitle: data.ogTitle || null,
    ogDescription: data.ogDescription || null,
    wordCount: analysis.wordCount,
    readingMinutes: analysis.readingMinutes,
  };

  const tagNames = (data.tags ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 12);

  const tagConnections = await Promise.all(
    tagNames.map(async (name) => {
      const tagSlug = slugify(name);
      const tag = await db.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { slug: tagSlug, name },
      });
      return { id: tag.id };
    }),
  );

  const post = postId
    ? await db.post.update({
        where: { id: postId },
        data: { ...payload, tags: { set: tagConnections } },
      })
    : await db.post.create({
        data: { ...payload, authorId: session.sub, tags: { connect: tagConnections } },
      });

  revalidatePath("/magazine");
  revalidatePath(`/magazine/${post.slug}`);
  if (existing && existing.slug !== post.slug) revalidatePath(`/magazine/${existing.slug}`);
  revalidatePath("/admin/blog");

  return {
    ok: true,
    message:
      data.status === "PUBLISHED"
        ? "Articolo pubblicato."
        : data.status === "SCHEDULED"
          ? "Articolo programmato."
          : "Bozza salvata.",
    slug: post.slug,
    // Serve al modulo per passare dalla rotta "nuovo" a quella dell'articolo
    // appena creato: restando su /blog/new, un secondo clic su Pubblica
    // creerebbe un duplicato con lo slug incrementato.
    id: post.id,
  };
}

export async function deletePost(postId: string): Promise<SaveResult> {
  await requireAdmin();

  const post = await db.post.delete({ where: { id: postId } });

  revalidatePath("/magazine");
  revalidatePath(`/magazine/${post.slug}`);
  revalidatePath("/admin/blog");
  return { ok: true, message: "Articolo eliminato." };
}

const categorySchema = z.object({
  name: z.string().trim().min(2, "Il nome è troppo corto.").max(60),
  description: z.string().trim().max(300).optional(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Serve un colore esadecimale, es. #FF4B26"),
  seoTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(180).optional(),
});

export async function saveCategory(
  categoryId: string | null,
  formData: FormData,
): Promise<SaveResult> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.name, async (candidate) => {
    const existing = await db.category.findUnique({ where: { slug: candidate } });
    return Boolean(existing) && existing?.id !== categoryId;
  });

  const payload = {
    name: data.name,
    slug,
    description: data.description || null,
    colorHex: data.colorHex,
    seoTitle: data.seoTitle || null,
    metaDescription: data.metaDescription || null,
  };

  if (categoryId) {
    await db.category.update({ where: { id: categoryId }, data: payload });
  } else {
    const last = await db.category.findFirst({ orderBy: { sortOrder: "desc" } });
    await db.category.create({ data: { ...payload, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }

  revalidatePath("/magazine");
  revalidatePath("/admin/blog/categories");
  return { ok: true, message: categoryId ? "Categoria aggiornata." : "Categoria creata." };
}

export async function deleteCategory(categoryId: string): Promise<SaveResult> {
  await requireAdmin();

  const count = await db.post.count({ where: { categoryId } });
  if (count > 0) {
    return {
      ok: false,
      message: `Ci sono ${count} articoli in questa categoria. Spostali prima di eliminarla.`,
    };
  }

  await db.category.delete({ where: { id: categoryId } });

  revalidatePath("/magazine");
  revalidatePath("/admin/blog/categories");
  return { ok: true, message: "Categoria eliminata." };
}
