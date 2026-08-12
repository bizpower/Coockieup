import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slug";

/**
 * Caricamento immagini.
 *
 * Scrive su disco in `public/uploads`. È la scelta giusta per un server
 * singolo o per lo sviluppo; su una piattaforma serverless il filesystem è
 * effimero e i file sparirebbero al primo rilancio. Il punto in cui passare a
 * uno storage a oggetti è questa funzione e nient'altro: il resto del progetto
 * conosce solo l'URL salvato in `Media.url`.
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
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = formData.get("alt")?.toString().trim() ?? "";
  const folder = slugify(formData.get("folder")?.toString() ?? "generale") || "generale";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
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

  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

  const media = await db.media.create({
    data: {
      filename,
      url: `/uploads/${folder}/${filename}`,
      alt,
      mimeType: file.type,
      sizeBytes: file.size,
      folder,
    },
  });

  return NextResponse.json({ media });
}
