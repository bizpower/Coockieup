"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { REGISTRY, type ContentKey } from "@/services/content.registry";

export type SaveResult = { ok: boolean; message: string };

/**
 * Salvataggio dei testi del sito.
 *
 * Il valore viene validato contro lo schema del registro **prima** di essere
 * scritto. Senza questo controllo, una virgola di troppo nel JSON manderebbe
 * in errore la homepage: il fallback al default protegge la lettura, ma è
 * molto meglio non far entrare il dato rotto.
 */
export async function saveSiteContent(key: string, rawJson: string): Promise<SaveResult> {
  await requireAdmin();

  if (!(key in REGISTRY)) return { ok: false, message: "Blocco di testo sconosciuto." };
  const entry = REGISTRY[key as ContentKey];

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return { ok: false, message: "Il contenuto non è JSON valido. Controlla virgole e parentesi." };
  }

  const validated = entry.schema.safeParse(parsedJson);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    return {
      ok: false,
      message: `Struttura non valida${issue ? ` in "${issue.path.join(".")}": ${issue.message}` : ""}.`,
    };
  }

  await db.siteSetting.upsert({
    where: { key },
    update: { valueJson: validated.data as object },
    create: {
      key,
      label: entry.label,
      group: entry.group,
      valueJson: validated.data as object,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Testo aggiornato. Il sito è già cambiato." };
}

/** Riporta un blocco al testo di partenza dichiarato nel codice. */
export async function resetSiteContent(key: string): Promise<SaveResult> {
  await requireAdmin();

  if (!(key in REGISTRY)) return { ok: false, message: "Blocco di testo sconosciuto." };
  const entry = REGISTRY[key as ContentKey];

  await db.siteSetting.upsert({
    where: { key },
    update: { valueJson: entry.default as object },
    create: { key, label: entry.label, group: entry.group, valueJson: entry.default as object },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Testo riportato all'originale." };
}

// --- FAQ ---------------------------------------------------------------------

const faqSchema = z.object({
  question: z.string().trim().min(5, "La domanda è troppo corta.").max(200),
  answer: z.string().trim().min(5, "La risposta è troppo corta.").max(2000),
  group: z.string().trim().min(1).max(40),
  isConfirmed: z.boolean(),
  isPublished: z.boolean(),
});

export async function saveFaq(faqId: string | null, formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const parsed = faqSchema.safeParse({
    question: formData.get("question")?.toString(),
    answer: formData.get("answer")?.toString(),
    group: formData.get("group")?.toString() || "prodotto",
    isConfirmed: formData.get("isConfirmed") === "on",
    isPublished: formData.get("isPublished") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  if (faqId) {
    await db.faqItem.update({ where: { id: faqId }, data: parsed.data });
  } else {
    const last = await db.faqItem.findFirst({ orderBy: { sortOrder: "desc" } });
    await db.faqItem.create({ data: { ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }

  revalidatePath("/faq");
  revalidatePath("/");
  revalidatePath("/admin/faq");
  return { ok: true, message: faqId ? "Domanda aggiornata." : "Domanda aggiunta." };
}

export async function deleteFaq(faqId: string): Promise<SaveResult> {
  await requireAdmin();
  await db.faqItem.delete({ where: { id: faqId } });

  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Domanda eliminata." };
}

// --- Pagine legali -----------------------------------------------------------

export async function saveLegalPage(pageId: string, formData: FormData): Promise<SaveResult> {
  await requireAdmin("ADMIN");

  const bodyHtml = formData.get("bodyHtml")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() || "Senza titolo";
  const needsLegalReview = formData.get("needsLegalReview") === "on";

  const page = await db.legalPage.update({
    where: { id: pageId },
    data: { title, bodyHtml, needsLegalReview },
  });

  revalidatePath(`/legal/${page.slug}`);
  revalidatePath("/admin/settings");
  return {
    ok: true,
    message: needsLegalReview
      ? "Salvato. La pagina resta segnalata come da rivedere."
      : "Salvato. L'avviso di revisione legale è stato tolto dalla pagina pubblica.",
  };
}

// --- Recensioni --------------------------------------------------------------

export async function deleteDemoReviews(): Promise<SaveResult> {
  await requireAdmin();

  const { count } = await db.review.deleteMany({ where: { isDemo: true } });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true, message: `Eliminate ${count} recensioni di esempio.` };
}
