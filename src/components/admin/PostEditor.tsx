"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";
import { deletePost, savePost } from "@/app/actions/admin/posts";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/admin/ui";
import { analyzeContent } from "@/lib/editor";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { ArticleEditor } from "./Editor";
import { SeoPanel } from "./SeoPanel";

/**
 * Schermata di scrittura.
 *
 * L'analisi SEO gira sul documento in memoria a ogni battuta, senza passare
 * dal server: i numeri si aggiornano mentre si scrive, che è l'unico momento
 * in cui servono davvero.
 */

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const inputClass =
  "border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors";

export type PostFormValues = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  scheduledFor: string;
  categoryId: string;
  featuredImageId: string;
  featuredImageAlt: string;
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  tags: string;
  contentJson: JSONContent | null;
};

export function PostEditor({
  post,
  categories,
  media,
}: {
  post: PostFormValues;
  categories: { id: string; name: string }[];
  media: { id: string; url: string; alt: string; filename: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [doc, setDoc] = useState<JSONContent>(post.contentJson ?? EMPTY_DOC);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.slug));
  const [status, setStatus] = useState(post.status);
  const [focusKeyword, setFocusKeyword] = useState(post.focusKeyword);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle);
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);

  const analysis = useMemo(() => analyzeContent(doc, focusKeyword), [doc, focusKeyword]);

  function handleTitleChange(value: string) {
    setTitle(value);
    // Lo slug segue il titolo finché nessuno lo tocca a mano. Dopo la prima
    // pubblicazione cambiarlo rompe i link già in giro, quindi non si tocca più.
    if (!slugTouched && !post.id) setSlug(slugify(value));
  }

  function submit(nextStatus: string) {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    formData.set("status", nextStatus);

    setResult(null);
    startTransition(async () => {
      const outcome = await savePost(post.id, doc, formData);
      setResult(outcome);
      if (!outcome.ok) return;

      setStatus(nextStatus);

      // Il primo salvataggio crea l'articolo: da qui in poi si continua a
      // modificare quello, non a crearne di nuovi a ogni clic.
      if (!post.id && outcome.id) {
        router.replace(`/admin/blog/${outcome.id}`);
        return;
      }

      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold">
              Titolo
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Il titolo dell'articolo"
              className={cn(inputClass, "font-display h-auto py-3 text-2xl font-extrabold")}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="slug" className="mb-1.5 block text-sm font-semibold">
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                  className={inputClass}
                />
                <p className="text-cacao-soft mt-1.5 text-xs">
                  /magazine/{slug || "slug-articolo"}
                </p>
              </div>

              <div>
                <label htmlFor="categoryId" className="mb-1.5 block text-sm font-semibold">
                  Categoria
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={post.categoryId}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="">Senza categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="excerpt" className="mb-1.5 block text-sm font-semibold">
                Estratto
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                maxLength={320}
                defaultValue={post.excerpt}
                placeholder="Se lo lasci vuoto lo ricaviamo dal primo paragrafo."
                className={cn(inputClass, "h-auto py-3")}
              />
            </div>
          </Panel>

          <ArticleEditor initialContent={doc} onChange={setDoc} />

          <Panel title="Copertina e tag">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="featuredImageId" className="mb-1.5 block text-sm font-semibold">
                  Immagine di copertina
                </label>
                <select
                  id="featuredImageId"
                  name="featuredImageId"
                  defaultValue={post.featuredImageId}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="">Nessuna</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.filename}
                    </option>
                  ))}
                </select>
                {media.length === 0 && (
                  <p className="text-cacao-soft mt-1.5 text-xs">
                    Nessuna immagine in libreria. Caricane una da Media.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="featuredImageAlt" className="mb-1.5 block text-sm font-semibold">
                  Testo alternativo della copertina
                </label>
                <input
                  id="featuredImageAlt"
                  name="featuredImageAlt"
                  defaultValue={post.featuredImageAlt}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold">
                  Tag
                </label>
                <input
                  id="tags"
                  name="tags"
                  defaultValue={post.tags}
                  placeholder="proteine, colazione, snack"
                  className={inputClass}
                />
                <p className="text-cacao-soft mt-1.5 text-xs">Separati da virgola.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Open Graph" description="Come appare l'articolo quando viene condiviso.">
            <div className="grid gap-4">
              <div>
                <label htmlFor="ogTitle" className="mb-1.5 block text-sm font-semibold">
                  Titolo per la condivisione
                </label>
                <input
                  id="ogTitle"
                  name="ogTitle"
                  defaultValue={post.ogTitle}
                  placeholder="Se vuoto usa il titolo SEO"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ogDescription" className="mb-1.5 block text-sm font-semibold">
                  Descrizione per la condivisione
                </label>
                <textarea
                  id="ogDescription"
                  name="ogDescription"
                  rows={2}
                  defaultValue={post.ogDescription}
                  placeholder="Se vuota usa la meta description"
                  className={cn(inputClass, "h-auto py-3")}
                />
              </div>
              <div>
                <label htmlFor="canonicalUrl" className="mb-1.5 block text-sm font-semibold">
                  URL canonico
                </label>
                <input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  defaultValue={post.canonicalUrl}
                  placeholder="Solo se l'articolo è pubblicato anche altrove"
                  className={inputClass}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Panel title="Pubblicazione">
            <p className="text-cacao-soft text-sm">
              Stato attuale:{" "}
              <span className="text-cacao font-semibold">
                {status === "PUBLISHED"
                  ? "pubblicato"
                  : status === "SCHEDULED"
                    ? "programmato"
                    : "bozza"}
              </span>
            </p>

            <div className="mt-4">
              <label htmlFor="scheduledFor" className="mb-1.5 block text-sm font-semibold">
                Data di pubblicazione programmata
              </label>
              <input
                id="scheduledFor"
                name="scheduledFor"
                type="datetime-local"
                defaultValue={post.scheduledFor}
                className={inputClass}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => submit("DRAFT")}
              >
                Salva bozza
              </Button>
              <Button
                type="button"
                variant="dark"
                size="sm"
                disabled={pending}
                onClick={() => submit("SCHEDULED")}
              >
                Programma
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={() => submit("PUBLISHED")}>
                {pending ? "Salvo…" : "Pubblica"}
              </Button>
            </div>

            <p aria-live="polite" className="min-h-5">
              {result && (
                <span
                  className={cn(
                    "mt-3 inline-block text-sm font-semibold",
                    result.ok ? "text-success" : "text-danger",
                  )}
                >
                  {result.message}
                </span>
              )}
            </p>

            {post.id && (
              <div className="border-cacao-line mt-4 border-t pt-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm("Eliminare definitivamente questo articolo?")) return;
                    startTransition(async () => {
                      const outcome = await deletePost(post.id!);
                      if (outcome.ok) router.push("/admin/blog");
                      else setResult(outcome);
                    });
                  }}
                  className="text-cacao-soft hover:text-danger text-sm font-semibold underline underline-offset-2"
                >
                  Elimina articolo
                </button>
              </div>
            )}
          </Panel>

          <Panel title="SEO">
            <div className="grid gap-4">
              <div>
                <label htmlFor="focusKeyword" className="mb-1.5 block text-sm font-semibold">
                  Parola chiave
                </label>
                <input
                  id="focusKeyword"
                  name="focusKeyword"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                  placeholder="biscotti proteici"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-semibold">
                  Titolo SEO
                </label>
                <input
                  id="seoTitle"
                  name="seoTitle"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Se vuoto usa il titolo dell'articolo"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="mb-1.5 block text-sm font-semibold">
                  Meta description
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={3}
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  className={cn(inputClass, "h-auto py-3")}
                />
              </div>
            </div>

            <div className="border-cacao-line mt-6 border-t pt-6">
              <SeoPanel
                title={title}
                seoTitle={seoTitle}
                metaDescription={metaDescription}
                slug={slug}
                focusKeyword={focusKeyword}
                analysis={analysis}
              />
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
