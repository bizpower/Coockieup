"use client";

import { useState, useTransition } from "react";
import { deleteCategory, saveCategory } from "@/app/actions/admin/posts";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string };

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  colorHex: string;
  seoTitle: string | null;
  metaDescription: string | null;
  postCount: number;
};

const inputClass =
  "border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors";

export function CategoryEditor({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const run = (fn: () => Promise<Result>) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await fn();
      setResult(outcome);
      if (outcome.ok) setEditing(null);
    });
  };

  return (
    <div>
      <ul className="divide-cacao-line divide-y">
        {categories.map((category) => (
          <li key={category.id} className="py-4">
            {editing === category.id ? (
              <CategoryFields
                category={category}
                pending={pending}
                onSave={(formData) => run(() => saveCategory(category.id, formData))}
                onCancel={() => setEditing(null)}
                onDelete={() => run(() => deleteCategory(category.id))}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: category.colorHex }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-cacao-soft text-xs">
                      /magazine/categoria/{category.slug} · {category.postCount}{" "}
                      {category.postCount === 1 ? "articolo" : "articoli"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(category.id)}
                  className="text-cacao-soft hover:text-cacao text-sm font-semibold underline underline-offset-2"
                >
                  Modifica
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="border-cacao-line mt-4 border-t pt-4">
          <CategoryFields
            category={null}
            pending={pending}
            onSave={(formData) => run(() => saveCategory(null, formData))}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setEditing("new")}
        >
          Nuova categoria
        </Button>
      )}

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
    </div>
  );
}

function CategoryFields({
  category,
  pending,
  onSave,
  onCancel,
  onDelete,
}: {
  category: CategoryRow | null;
  pending: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const key = category?.id ?? "new";

  return (
    <form action={onSave}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${key}`} className="mb-1.5 block text-sm font-semibold">
            Nome
          </label>
          <input
            id={`name-${key}`}
            name="name"
            defaultValue={category?.name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`color-${key}`} className="mb-1.5 block text-sm font-semibold">
            Colore
          </label>
          <div className="flex gap-2">
            <input
              id={`color-${key}`}
              name="colorHex"
              defaultValue={category?.colorHex ?? "#FF4B26"}
              className={inputClass}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`description-${key}`} className="mb-1.5 block text-sm font-semibold">
            Descrizione
          </label>
          <textarea
            id={`description-${key}`}
            name="description"
            rows={2}
            defaultValue={category?.description ?? ""}
            className={cn(inputClass, "h-auto py-3")}
          />
          <p className="text-cacao-soft mt-1.5 text-xs">
            Compare in cima alla pagina della categoria e nei risultati di ricerca.
          </p>
        </div>

        <div>
          <label htmlFor={`seoTitle-${key}`} className="mb-1.5 block text-sm font-semibold">
            Titolo SEO
          </label>
          <input
            id={`seoTitle-${key}`}
            name="seoTitle"
            maxLength={70}
            defaultValue={category?.seoTitle ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`meta-${key}`} className="mb-1.5 block text-sm font-semibold">
            Meta description
          </label>
          <input
            id={`meta-${key}`}
            name="metaDescription"
            maxLength={180}
            defaultValue={category?.metaDescription ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" size="sm" disabled={pending}>
          {pending ? "Salvo…" : "Salva"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-cacao-soft hover:text-cacao text-sm font-semibold"
        >
          Annulla
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-cacao-soft hover:text-danger ml-auto text-sm font-semibold"
          >
            Elimina
          </button>
        )}
      </div>
    </form>
  );
}
