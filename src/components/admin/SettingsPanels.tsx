"use client";

import { useState, useTransition } from "react";
import { deleteDemoReviews, saveLegalPage } from "@/app/actions/admin/content";
import { deleteDemoOrders } from "@/app/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string };

/** Pulizia dei contenuti di collaudo, con conferma esplicita perché è irreversibile. */
export function DemoDataCleanup({
  demoReviews,
  demoOrders,
}: {
  demoReviews: number;
  demoOrders: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const run = (fn: () => Promise<Result>) => {
    setConfirming(null);
    setResult(null);
    startTransition(async () => setResult(await fn()));
  };

  if (demoReviews === 0 && demoOrders === 0) {
    return (
      <p className="text-cacao-soft text-sm">
        Nessun contenuto di esempio nel database. Tutto quello che vedi nel pannello è reale.
      </p>
    );
  }

  return (
    <div>
      <p className="text-cacao-soft text-sm leading-relaxed">
        Recensioni e ordini di prova servono a costruire e collaudare le pagine. Vanno
        eliminati prima di aprire gli ordini: le recensioni finte non contribuiscono già
        adesso alla valutazione dichiarata ai motori di ricerca, ma restano visibili in
        pagina come esempi.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {demoReviews > 0 && (
          <div>
            {confirming === "reviews" ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="dark"
                  disabled={pending}
                  onClick={() => run(deleteDemoReviews)}
                >
                  Sì, elimina {demoReviews}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="text-cacao-soft text-sm font-semibold"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirming("reviews")}
              >
                Elimina {demoReviews} recensioni di esempio
              </Button>
            )}
          </div>
        )}

        {demoOrders > 0 && (
          <div>
            {confirming === "orders" ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="dark"
                  disabled={pending}
                  onClick={() => run(deleteDemoOrders)}
                >
                  Sì, elimina {demoOrders}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="text-cacao-soft text-sm font-semibold"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirming("orders")}
              >
                Elimina {demoOrders} ordini di prova
              </Button>
            )}
          </div>
        )}
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
    </div>
  );
}

export type LegalPageRow = {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  needsLegalReview: boolean;
};

/**
 * Pagine legali.
 *
 * L'interruttore "da rivedere" è la cosa importante: finché resta acceso, la
 * pagina pubblica mostra un avviso. Spegnerlo è una dichiarazione — quel testo
 * è stato letto da qualcuno che se ne assume la responsabilità.
 */
export function LegalPagesEditor({ pages }: { pages: LegalPageRow[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <ul className="divide-cacao-line divide-y">
        {pages.map((page) => (
          <li key={page.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {page.title}
                  {page.needsLegalReview && (
                    <span className="bg-energy-wash text-warning ml-2 rounded-full px-2 py-0.5 text-xs font-bold">
                      da rivedere
                    </span>
                  )}
                </p>
                <p className="text-cacao-soft text-xs">/legal/{page.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(open === page.id ? null : page.id)}
                className="text-cacao-soft hover:text-cacao text-sm font-semibold underline underline-offset-2"
              >
                {open === page.id ? "Chiudi" : "Modifica"}
              </button>
            </div>

            {open === page.id && (
              <form
                action={(formData) =>
                  startTransition(async () => setResult(await saveLegalPage(page.id, formData)))
                }
                className="mt-4"
              >
                <label htmlFor={`title-${page.id}`} className="mb-1.5 block text-sm font-semibold">
                  Titolo
                </label>
                <input
                  id={`title-${page.id}`}
                  name="title"
                  defaultValue={page.title}
                  className="border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors"
                />

                <label
                  htmlFor={`body-${page.id}`}
                  className="mt-4 mb-1.5 block text-sm font-semibold"
                >
                  Testo (HTML)
                </label>
                <textarea
                  id={`body-${page.id}`}
                  name="bodyHtml"
                  rows={14}
                  defaultValue={page.bodyHtml}
                  spellCheck={false}
                  className="border-cacao-line bg-panna focus:border-cacao w-full rounded-lg border p-3.5 font-mono text-xs leading-relaxed outline-none transition-colors"
                />

                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="needsLegalReview"
                    defaultChecked={page.needsLegalReview}
                    className="accent-fiamma mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="font-semibold">Da sottoporre a revisione legale</span>
                    <span className="text-cacao-soft block text-xs">
                      Finché è spuntata, la pagina pubblica mostra un avviso che il testo è
                      una bozza.
                    </span>
                  </span>
                </label>

                <Button type="submit" variant="dark" size="sm" className="mt-4" disabled={pending}>
                  {pending ? "Salvo…" : "Salva pagina"}
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>

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
