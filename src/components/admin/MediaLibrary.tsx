"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, updateMediaAlt } from "@/app/actions/admin/media";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  filename: string;
  url: string;
  alt: string;
  folder: string;
  sizeBytes: number;
  createdAt: string;
  usedInPosts: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Libreria media.
 *
 * Il testo alternativo si chiede **durante** il caricamento, non dopo: un
 * campo facoltativo da riempire più tardi resta vuoto per sempre, e ogni
 * immagine senza alt è un pezzo di sito illeggibile per chi usa uno screen
 * reader.
 */
export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? items.filter(
        (item) =>
          item.filename.toLowerCase().includes(query.toLowerCase()) ||
          item.alt.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();

    const file = fileRef.current?.files?.[0];
    const alt = altRef.current?.value.trim() ?? "";

    if (!file) {
      setMessage({ ok: false, text: "Scegli un file." });
      return;
    }
    if (!alt) {
      setMessage({ ok: false, text: "Il testo alternativo è obbligatorio." });
      altRef.current?.focus();
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("alt", alt);
    body.append("folder", "magazine");

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/media/upload", { method: "POST", body });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({ ok: false, text: payload.error ?? "Caricamento non riuscito." });
      } else {
        setMessage({ ok: true, text: "Immagine caricata." });
        if (fileRef.current) fileRef.current.value = "";
        if (altRef.current) altRef.current.value = "";
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Caricamento non riuscito. Controlla la connessione." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleUpload}
        className="border-cacao-line rounded-xl border border-dashed p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <div>
            <label htmlFor="media-file" className="mb-1.5 block text-sm font-semibold">
              File
            </label>
            <input
              id="media-file"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="text-cacao-soft file:bg-cacao file:text-panna w-full text-sm file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
            />
          </div>

          <div>
            <label htmlFor="media-alt" className="mb-1.5 block text-sm font-semibold">
              Testo alternativo <span className="text-fiamma">obbligatorio</span>
            </label>
            <input
              id="media-alt"
              ref={altRef}
              placeholder="Descrivi cosa si vede nell'immagine"
              className="border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors"
            />
          </div>

          <Button type="submit" variant="dark" size="sm" disabled={uploading}>
            {uploading ? "Carico…" : "Carica"}
          </Button>
        </div>

        <p aria-live="polite" className="min-h-5">
          {message && (
            <span
              className={cn(
                "mt-2 inline-block text-sm font-semibold",
                message.ok ? "text-success" : "text-danger",
              )}
            >
              {message.text}
            </span>
          )}
        </p>
      </form>

      {items.length > 0 && (
        <div className="mt-6">
          <label htmlFor="media-search" className="sr-only">
            Cerca fra le immagini
          </label>
          <input
            id="media-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nome file o testo alternativo…"
            className="border-cacao-line bg-panna focus:border-cacao h-10 w-full max-w-sm rounded-lg border px-3.5 text-sm outline-none transition-colors"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-cacao-soft py-12 text-center text-sm">
          {items.length === 0
            ? "Nessuna immagine caricata."
            : "Nessuna immagine corrisponde alla ricerca."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id} className="border-cacao-line overflow-hidden rounded-xl border">
              <div className="bg-crema relative aspect-[4/3]">
                <Image
                  src={item.url}
                  alt={item.alt || item.filename}
                  fill
                  sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <p className="truncate text-sm font-semibold" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-cacao-soft text-xs">
                  {formatBytes(item.sizeBytes)} · {item.folder}
                  {item.usedInPosts > 0 && ` · usata in ${item.usedInPosts}`}
                </p>

                <form
                  action={(formData) =>
                    startTransition(async () => {
                      const result = await updateMediaAlt(
                        item.id,
                        formData.get("alt")?.toString() ?? "",
                      );
                      setMessage({ ok: result.ok, text: result.message });
                    })
                  }
                  className="mt-3"
                >
                  <label htmlFor={`alt-${item.id}`} className="sr-only">
                    Testo alternativo di {item.filename}
                  </label>
                  <input
                    id={`alt-${item.id}`}
                    name="alt"
                    defaultValue={item.alt}
                    placeholder="Testo alternativo"
                    className={cn(
                      "bg-panna h-9 w-full rounded-lg border px-3 text-xs outline-none transition-colors",
                      item.alt ? "border-cacao-line focus:border-cacao" : "border-warning",
                    )}
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={pending}
                      className="text-cacao-soft hover:text-cacao text-xs font-semibold underline underline-offset-2"
                    >
                      Salva alt
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteMedia(item.id);
                          setMessage({ ok: result.ok, text: result.message });
                        })
                      }
                      className="text-cacao-soft hover:text-danger text-xs font-semibold underline underline-offset-2"
                    >
                      Elimina
                    </button>
                  </div>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
