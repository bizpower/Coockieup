"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { slugify } from "@/lib/slug";

/**
 * Catalogo.
 *
 * Le azioni sono separate per blocco — anagrafica, formati, valori, ingredienti,
 * allergeni — invece di un unico modulo gigante. Salvare il prezzo di una
 * variante non deve richiedere di rimandare al server anche la tabella
 * nutrizionale, e un errore in un blocco non deve far perdere il lavoro fatto
 * negli altri.
 */

export type SaveResult = { ok: boolean; message: string };

function revalidateProduct(slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
}

const productSchema = z.object({
  name: z.string().trim().min(2, "Il nome è obbligatorio.").max(140),
  slug: z.string().trim().max(140).optional(),
  subtitle: z.string().trim().max(160).optional(),
  description: z.string().trim().min(10, "Serve una descrizione."),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  unitsPerBox: z.coerce.number().int().min(1).max(500),
  seoTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(180).optional(),
});

export async function saveProduct(productId: string, formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  // Lo slug è la URL pubblica: se è già di un altro prodotto, i link del sito
  // punterebbero alla scheda sbagliata.
  const clash = await db.product.findFirst({ where: { slug, NOT: { id: productId } } });
  if (clash) return { ok: false, message: `Lo slug "${slug}" è già usato da un altro prodotto.` };

  const previous = await db.product.findUnique({ where: { id: productId } });

  await db.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      slug,
      subtitle: data.subtitle || null,
      description: data.description,
      status: data.status,
      unitsPerBox: data.unitsPerBox,
      seoTitle: data.seoTitle || null,
      metaDescription: data.metaDescription || null,
    },
  });

  revalidateProduct(slug);
  if (previous && previous.slug !== slug) revalidateProduct(previous.slug);

  return { ok: true, message: "Prodotto salvato." };
}

const variantSchema = z.object({
  name: z.string().trim().min(1, "Il nome del formato è obbligatorio.").max(80),
  sku: z.string().trim().min(1, "Lo SKU è obbligatorio.").max(40),
  boxCount: z.coerce.number().int().min(1).max(999),
  priceCents: z.coerce.number().int().min(1, "Il prezzo deve essere maggiore di zero."),
  compareAtCents: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  badge: z.string().trim().max(40).optional(),
  isActive: z.coerce.boolean().optional(),
  isDefault: z.coerce.boolean().optional(),
});

export async function saveVariant(
  productId: string,
  variantId: string | null,
  formData: FormData,
): Promise<SaveResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = variantSchema.safeParse({
    ...raw,
    isActive: raw.isActive === "on",
    isDefault: raw.isDefault === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const data = parsed.data;

  // Un prezzo barrato più basso di quello di vendita mostrerebbe uno sconto
  // negativo in vetrina: meglio rifiutarlo qui che scoprirlo in produzione.
  if (data.compareAtCents && data.compareAtCents > 0 && data.compareAtCents <= data.priceCents) {
    return {
      ok: false,
      message: "Il prezzo barrato deve essere più alto del prezzo di vendita.",
    };
  }

  const skuClash = await db.productVariant.findFirst({
    where: { sku: data.sku, ...(variantId ? { NOT: { id: variantId } } : {}) },
  });
  if (skuClash) return { ok: false, message: `Lo SKU "${data.sku}" è già in uso.` };

  const payload = {
    name: data.name,
    sku: data.sku,
    boxCount: data.boxCount,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents && data.compareAtCents > 0 ? data.compareAtCents : null,
    stock: data.stock,
    badge: data.badge || null,
    isActive: data.isActive ?? false,
    isDefault: data.isDefault ?? false,
  };

  await db.$transaction(async (tx) => {
    // Il "consigliato" è uno solo: due formati evidenziati insieme non
    // consigliano niente.
    if (payload.isDefault) {
      await tx.productVariant.updateMany({
        where: { productId, ...(variantId ? { NOT: { id: variantId } } : {}) },
        data: { isDefault: false },
      });
    }

    if (variantId) {
      await tx.productVariant.update({ where: { id: variantId }, data: payload });
    } else {
      const last = await tx.productVariant.findFirst({
        where: { productId },
        orderBy: { sortOrder: "desc" },
      });
      await tx.productVariant.create({
        data: { ...payload, productId, sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
    }
  });

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidateProduct(product?.slug);

  return { ok: true, message: variantId ? "Formato aggiornato." : "Formato aggiunto." };
}

export async function deleteVariant(variantId: string): Promise<SaveResult> {
  await requireAdmin();

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true, _count: { select: { orderItems: true } } },
  });

  if (!variant) return { ok: false, message: "Formato non trovato." };

  // Cancellare un formato già venduto spezzerebbe il collegamento con gli
  // ordini che lo contengono. Si disattiva: sparisce dal sito, resta in storia.
  if (variant._count.orderItems > 0) {
    await db.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
    revalidateProduct(variant.product.slug);
    return {
      ok: true,
      message: "Il formato è stato venduto in passato, quindi è stato disattivato invece che eliminato.",
    };
  }

  await db.productVariant.delete({ where: { id: variantId } });
  revalidateProduct(variant.product.slug);
  return { ok: true, message: "Formato eliminato." };
}

/**
 * Salvataggio di un blocco di dati soggetti a conferma.
 *
 * Vale per valori nutrizionali, ingredienti e allergeni: stessa struttura,
 * stesso interruttore "confermato". È il punto in cui un dato smette di
 * essere un obiettivo di formulazione e diventa una dichiarazione: da qui
 * in poi il badge "DA CONFERMARE" sparisce dal sito pubblico.
 */
export async function saveConfirmableRows(
  productId: string,
  kind: "nutrition" | "ingredients" | "allergens",
  formData: FormData,
): Promise<SaveResult> {
  await requireAdmin();

  const ids = formData.getAll("id").map(String);

  await db.$transaction(async (tx) => {
    for (const id of ids) {
      const confirmed = formData.get(`confirmed_${id}`) === "on";

      if (kind === "nutrition") {
        await tx.nutritionFact.update({
          where: { id },
          data: {
            label: formData.get(`label_${id}`)?.toString().trim() || "—",
            value: formData.get(`value_${id}`)?.toString().trim() || "—",
            unit: formData.get(`unit_${id}`)?.toString().trim() || null,
            isHighlight: formData.get(`highlight_${id}`) === "on",
            isConfirmed: confirmed,
          },
        });
      } else if (kind === "ingredients") {
        await tx.ingredient.update({
          where: { id },
          data: {
            name: formData.get(`name_${id}`)?.toString().trim() || "—",
            note: formData.get(`note_${id}`)?.toString().trim() || null,
            isConfirmed: confirmed,
          },
        });
      } else {
        await tx.allergen.update({
          where: { id },
          data: {
            label: formData.get(`label_${id}`)?.toString().trim() || "—",
            isPresent: formData.get(`present_${id}`) === "on",
            isConfirmed: confirmed,
          },
        });
      }
    }
  });

  const product = await db.product.findUnique({ where: { id: productId } });
  revalidateProduct(product?.slug);

  return { ok: true, message: "Modifiche salvate." };
}
