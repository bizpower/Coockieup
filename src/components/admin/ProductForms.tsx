"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  deleteVariant,
  saveConfirmableRows,
  saveProduct,
  saveVariant,
  type SaveResult,
} from "@/app/actions/admin/products";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Moduli della scheda prodotto in amministrazione.
 *
 * Ogni blocco è un form indipendente con il suo esito: salvare il prezzo non
 * deve rimandare al server anche la tabella nutrizionale, e un errore in un
 * blocco non deve far perdere quello che si stava scrivendo negli altri.
 */

function useSaver() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);

  const run = (fn: () => Promise<SaveResult>) => {
    setResult(null);
    startTransition(async () => setResult(await fn()));
  };

  const feedback = (
    <p aria-live="polite" className="min-h-5">
      {result && (
        <span
          className={cn(
            "mt-2 inline-block text-sm font-semibold",
            result.ok ? "text-success" : "text-danger",
          )}
        >
          {result.message}
        </span>
      )}
    </p>
  );

  return { pending, run, feedback };
}

const inputClass =
  "border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors";

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
    </label>
  );
}

// --- Anagrafica --------------------------------------------------------------

export function ProductDetailsForm({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    subtitle: string | null;
    description: string;
    status: string;
    unitsPerBox: number;
    seoTitle: string | null;
    metaDescription: string | null;
  };
}) {
  const { pending, run, feedback } = useSaver();

  return (
    <form action={(formData) => run(() => saveProduct(product.id, formData))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <input id="name" name="name" defaultValue={product.name} className={inputClass} />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <input id="slug" name="slug" defaultValue={product.slug} className={inputClass} />
          <p className="text-cacao-soft mt-1.5 text-xs">/product/{product.slug}</p>
        </div>

        <div>
          <Label htmlFor="status">Stato</Label>
          <select
            id="status"
            name="status"
            defaultValue={product.status}
            className={cn(inputClass, "cursor-pointer")}
          >
            <option value="DRAFT">Bozza — non visibile</option>
            <option value="ACTIVE">Attivo — in vendita</option>
            <option value="ARCHIVED">Archiviato</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="subtitle">Sottotitolo</Label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={product.subtitle ?? ""}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Descrizione</Label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product.description}
            className={cn(inputClass, "h-auto py-3")}
          />
        </div>

        <div>
          <Label htmlFor="unitsPerBox">Biscotti per confezione</Label>
          <input
            id="unitsPerBox"
            name="unitsPerBox"
            type="number"
            min={1}
            defaultValue={product.unitsPerBox}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="border-cacao-line mt-6 border-t pt-5">
        <legend className="text-sm font-bold">SEO</legend>
        <div className="mt-3 grid gap-4">
          <div>
            <Label htmlFor="seoTitle">Titolo SEO</Label>
            <input
              id="seoTitle"
              name="seoTitle"
              maxLength={70}
              defaultValue={product.seoTitle ?? ""}
              className={inputClass}
            />
            <p className="text-cacao-soft mt-1.5 text-xs">
              Massimo 70 caratteri: oltre, Google taglia.
            </p>
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta description</Label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              maxLength={180}
              defaultValue={product.metaDescription ?? ""}
              className={cn(inputClass, "h-auto py-3")}
            />
          </div>
        </div>
      </fieldset>

      <Button type="submit" variant="dark" size="sm" className="mt-5" disabled={pending}>
        {pending ? "Salvo…" : "Salva prodotto"}
      </Button>
      {feedback}
    </form>
  );
}

// --- Formati -----------------------------------------------------------------

type VariantRow = {
  id: string;
  name: string;
  sku: string;
  boxCount: number;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  badge: string | null;
  isActive: boolean;
  isDefault: boolean;
  orderCount: number;
};

export function VariantEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: VariantRow[];
}) {
  const { pending, run, feedback } = useSaver();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <ul className="divide-cacao-line divide-y">
        {variants.map((variant) => (
          <li key={variant.id} className="py-4">
            {editing === variant.id ? (
              <VariantFields
                productId={productId}
                variant={variant}
                pending={pending}
                onSave={(formData) =>
                  run(async () => {
                    const result = await saveVariant(productId, variant.id, formData);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
                onCancel={() => setEditing(null)}
                onDelete={() => run(() => deleteVariant(variant.id))}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {variant.name}
                    {variant.isDefault && (
                      <span className="bg-fiamma text-cacao ml-2 rounded-full px-2 py-0.5 text-xs font-bold">
                        consigliato
                      </span>
                    )}
                    {!variant.isActive && (
                      <span className="bg-crema text-cacao-soft ml-2 rounded-full px-2 py-0.5 text-xs font-bold">
                        disattivato
                      </span>
                    )}
                  </p>
                  <p className="text-cacao-soft text-sm">
                    {variant.sku} · {formatPrice(variant.priceCents)}
                    {variant.compareAtCents && ` (barrato ${formatPrice(variant.compareAtCents)})`} ·{" "}
                    giacenza {variant.stock}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(variant.id)}
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
          <VariantFields
            productId={productId}
            variant={null}
            pending={pending}
            onSave={(formData) =>
              run(async () => {
                const result = await saveVariant(productId, null, formData);
                if (result.ok) setEditing(null);
                return result;
              })
            }
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
          Aggiungi formato
        </Button>
      )}

      {feedback}
    </div>
  );
}

function VariantFields({
  variant,
  pending,
  onSave,
  onCancel,
  onDelete,
}: {
  productId: string;
  variant: VariantRow | null;
  pending: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <form action={onSave}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`name-${variant?.id ?? "new"}`}>Nome</Label>
          <input
            id={`name-${variant?.id ?? "new"}`}
            name="name"
            defaultValue={variant?.name ?? ""}
            placeholder="3 box"
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`sku-${variant?.id ?? "new"}`}>SKU</Label>
          <input
            id={`sku-${variant?.id ?? "new"}`}
            name="sku"
            defaultValue={variant?.sku ?? ""}
            placeholder="BOX-03"
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`boxCount-${variant?.id ?? "new"}`}>Confezioni incluse</Label>
          <input
            id={`boxCount-${variant?.id ?? "new"}`}
            name="boxCount"
            type="number"
            min={1}
            defaultValue={variant?.boxCount ?? 1}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`price-${variant?.id ?? "new"}`}>Prezzo (centesimi)</Label>
          <input
            id={`price-${variant?.id ?? "new"}`}
            name="priceCents"
            type="number"
            min={1}
            defaultValue={variant?.priceCents ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`compare-${variant?.id ?? "new"}`}>Prezzo barrato</Label>
          <input
            id={`compare-${variant?.id ?? "new"}`}
            name="compareAtCents"
            type="number"
            min={0}
            defaultValue={variant?.compareAtCents ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`stock-${variant?.id ?? "new"}`}>Giacenza</Label>
          <input
            id={`stock-${variant?.id ?? "new"}`}
            name="stock"
            type="number"
            min={0}
            defaultValue={variant?.stock ?? 0}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`badge-${variant?.id ?? "new"}`}>Etichetta</Label>
          <input
            id={`badge-${variant?.id ?? "new"}`}
            name="badge"
            defaultValue={variant?.badge ?? ""}
            placeholder="Il più scelto"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={variant?.isActive ?? true}
            className="accent-fiamma h-4 w-4"
          />
          In vendita
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={variant?.isDefault ?? false}
            className="accent-fiamma h-4 w-4"
          />
          Consigliato
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" size="sm" disabled={pending}>
          {pending ? "Salvo…" : "Salva formato"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-cacao-soft hover:text-cacao text-sm font-semibold"
        >
          Annulla
        </button>
        {onDelete && variant && (
          <button
            type="button"
            onClick={onDelete}
            className="text-cacao-soft hover:text-danger ml-auto text-sm font-semibold"
          >
            {variant.orderCount > 0 ? "Disattiva" : "Elimina"}
          </button>
        )}
      </div>
    </form>
  );
}

// --- Dati soggetti a conferma ------------------------------------------------

type ConfirmableKind = "nutrition" | "ingredients" | "allergens";

export function ConfirmableEditor({
  productId,
  kind,
  rows,
}: {
  productId: string;
  kind: ConfirmableKind;
  rows: {
    id: string;
    isConfirmed: boolean;
    label?: string;
    value?: string;
    unit?: string | null;
    isHighlight?: boolean;
    name?: string;
    note?: string | null;
    isPresent?: boolean;
  }[];
}) {
  const { pending, run, feedback } = useSaver();
  const unconfirmed = rows.filter((row) => !row.isConfirmed).length;

  return (
    <form action={(formData) => run(() => saveConfirmableRows(productId, kind, formData))}>
      {unconfirmed > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-5 border-l-4 px-4 py-3 text-sm leading-relaxed font-medium">
          {unconfirmed} {unconfirmed === 1 ? "voce non è confermata" : "voci non sono confermate"}:
          sul sito compaiono con il badge <strong>DA CONFERMARE</strong>. Spunta la casella
          solo quando il dato è validato — da lì in poi diventa una dichiarazione al pubblico.
        </p>
      )}

      <ul className="divide-cacao-line divide-y">
        {rows.map((row) => (
          <li key={row.id} className="py-3.5">
            <input type="hidden" name="id" value={row.id} />

            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
              {kind === "nutrition" && (
                <>
                  <div>
                    <Label htmlFor={`label_${row.id}`}>Voce</Label>
                    <input
                      id={`label_${row.id}`}
                      name={`label_${row.id}`}
                      defaultValue={row.label}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`value_${row.id}`}>Valore</Label>
                      <input
                        id={`value_${row.id}`}
                        name={`value_${row.id}`}
                        defaultValue={row.value}
                        className={inputClass}
                      />
                    </div>
                    <div className="w-20">
                      <Label htmlFor={`unit_${row.id}`}>Unità</Label>
                      <input
                        id={`unit_${row.id}`}
                        name={`unit_${row.id}`}
                        defaultValue={row.unit ?? ""}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {kind === "ingredients" && (
                <>
                  <div>
                    <Label htmlFor={`name_${row.id}`}>Ingrediente</Label>
                    <input
                      id={`name_${row.id}`}
                      name={`name_${row.id}`}
                      defaultValue={row.name}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`note_${row.id}`}>Nota</Label>
                    <input
                      id={`note_${row.id}`}
                      name={`note_${row.id}`}
                      defaultValue={row.note ?? ""}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {kind === "allergens" && (
                <>
                  <div>
                    <Label htmlFor={`label_${row.id}`}>Allergene</Label>
                    <input
                      id={`label_${row.id}`}
                      name={`label_${row.id}`}
                      defaultValue={row.label}
                      className={inputClass}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 pb-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      name={`present_${row.id}`}
                      defaultChecked={row.isPresent}
                      className="accent-fiamma h-4 w-4"
                    />
                    Contiene (altrimenti: tracce)
                  </label>
                </>
              )}

              <label className="flex cursor-pointer items-center gap-2 pb-3 text-sm font-semibold whitespace-nowrap">
                <input
                  type="checkbox"
                  name={`confirmed_${row.id}`}
                  defaultChecked={row.isConfirmed}
                  className="accent-success h-4 w-4"
                />
                Confermato
              </label>
            </div>

            {kind === "nutrition" && (
              <label className="text-cacao-soft mt-1 flex cursor-pointer items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  name={`highlight_${row.id}`}
                  defaultChecked={row.isHighlight}
                  className="accent-fiamma h-3.5 w-3.5"
                />
                In evidenza in homepage
              </label>
            )}
          </li>
        ))}
      </ul>

      <Button type="submit" variant="dark" size="sm" className="mt-5" disabled={pending}>
        {pending ? "Salvo…" : "Salva"}
      </Button>
      {feedback}
    </form>
  );
}
