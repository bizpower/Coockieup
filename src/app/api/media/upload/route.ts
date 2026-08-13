import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import {
  salvaFile,
  StorageNonConfigurato,
  StorageNonRisponde,
} from "@/lib/storage";

/**
 * Caricamento immagini.
 *
 * Qui si controlla *cosa* può essere caricato — chi, che formato, quanto
 * grande, con che nome. Dove il file finisca è un'altra questione, e sta in
 * lib/storage: disco in locale, Vercel Blob in produzione.
 */

const MAX_BYTES = 5 * 1024 * 1024;

// Solo formati che un browser sa mostrare. Nessun SVG: può contenere script,
// e servito dallo stesso dominio diventerebbe un vettore XSS.
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = formData.get("alt")?.toString().trim() ?? "";
  const folder =
    slugify(formData.get("folder")?.toString() ?? "generale") || "generale";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Nessun file ricevuto." },
      { status: 400 },
    );
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Formato non ammesso. Usa JPG, PNG, WebP, AVIF o GIF." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Il file supera i ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  // Il nome originale non finisce mai nel percorso: contiene caratteri
  // arbitrari e, con essi, la possibilità di uscire dalla cartella.
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "immagine";
  const filename = `${base}-${randomUUID().slice(0, 8)}.${extension}`;

  let salvato;
  try {
    salvato = await salvaFile(Buffer.from(await file.arrayBuffer()), {
      cartella: folder,
      nome: filename,
      tipo: file.type,
    });
  } catch (errore) {
    // Se lo storage non è a posto il record non va creato: rimanderebbe a un
    // file che non esiste, e l'immagine comparirebbe rotta nella libreria.
    if (errore instanceof StorageNonConfigurato) {
      return NextResponse.json({ error: errore.message }, { status: 503 });
    }
    if (errore instanceof StorageNonRisponde) {
      return NextResponse.json(
        { error: `${errore.message} Riprova fra poco.` },
        { status: 504 },
      );
    }
    console.error("Caricamento fallito:", errore);
    return NextResponse.json(
      { error: "Il caricamento non è riuscito. Riprova." },
      { status: 502 },
    );
  }

  const media = await db.media.create({
    data: {
      filename,
      url: salvato.url,
      alt,
      mimeType: file.type,
      sizeBytes: file.size,
      folder,
    },
  });

  return NextResponse.json({ media });
}
