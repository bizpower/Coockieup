"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { eliminaFile } from "@/lib/storage";

export type SaveResult = { ok: boolean; message: string };

/** Il testo alternativo è modificabile dopo il caricamento: spesso si scrive meglio a mente fredda. */
export async function updateMediaAlt(
  mediaId: string,
  alt: string,
): Promise<SaveResult> {
  await requireAdmin();

  await db.media.update({ where: { id: mediaId }, data: { alt: alt.trim() } });

  revalidatePath("/admin/media");
  return { ok: true, message: "Testo alternativo salvato." };
}

export async function deleteMedia(mediaId: string): Promise<SaveResult> {
  await requireAdmin();

  const media = await db.media.findUnique({
    where: { id: mediaId },
    include: { _count: { select: { posts: true } } },
  });

  if (!media) return { ok: false, message: "File non trovato." };

  // Un'immagine usata come copertina non si cancella di nascosto: sparirebbe
  // da un articolo pubblicato senza che nessuno se ne accorga.
  if (media._count.posts > 0) {
    return {
      ok: false,
      message: `Questa immagine è la copertina di ${media._count.posts} ${media._count.posts === 1 ? "articolo" : "articoli"}. Sostituiscila prima di eliminarla.`,
    };
  }

  await db.media.delete({ where: { id: mediaId } });

  // Il file è secondario rispetto al record, e `eliminaFile` non solleva mai:
  // un file orfano si ripulisce, un record rimasto lascia un'immagine rotta.
  await eliminaFile(media.url);

  revalidatePath("/admin/media");
  return { ok: true, message: "Immagine eliminata." };
}
