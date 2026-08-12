"use client";

import { useState, useTransition, type ReactNode } from "react";
import { deleteFaq, resetSiteContent, saveFaq, saveSiteContent } from "@/app/actions/admin/content";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/app/actions/admin/coupons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string };

const inputClass =
  "border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors";

function useSaver() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  const run = (fn: () => Promise<Result>) => {
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

  return { pending, run, feedback, result };
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
    </label>
  );
}

// --- Testi del sito ----------------------------------------------------------

/**
 * Modifica di un blocco di copy.
 *
 * L'editor è JSON, non un modulo generato: i blocchi hanno forme diverse
 * (una stringa, una lista di card, due CTA annidate) e un modulo dinamico che
 * le coprisse tutte sarebbe più fragile del testo grezzo. La validazione
 * avviene sul server contro lo schema Zod, quindi un JSON sbagliato viene
 * respinto con un messaggio invece di rompere la homepage.
 */
export function ContentBlockEditor({
  contentKey,
  label,
  value,
}: {
  contentKey: string;
  label: string;
  value: unknown;
}) {
  const { pending, run, feedback } = useSaver();
  const [json, setJson] = useState(() => JSON.stringify(value, null, 2));
  const lines = json.split("\n").length;

  return (
    <div>
      <Label htmlFor={`content-${contentKey}`}>{label}</Label>
      <textarea
        id={`content-${contentKey}`}
        value={json}
        onChange={(event) => setJson(event.target.value)}
        spellCheck={false}
        rows={Math.min(Math.max(lines, 4), 26)}
        className={cn(inputClass, "h-auto py-3 font-mono text-xs leading-relaxed")}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="dark"
          size="sm"
          disabled={pending}
          onClick={() => run(() => saveSiteContent(contentKey, json))}
        >
          {pending ? "Salvo…" : "Salva"}
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await resetSiteContent(contentKey);
              if (result.ok) window.location.reload();
              return result;
            })
          }
          className="text-cacao-soft hover:text-cacao text-sm font-semibold underline underline-offset-2"
        >
          Ripristina l&apos;originale
        </button>
      </div>

      {feedback}
    </div>
  );
}

// --- FAQ ---------------------------------------------------------------------

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  group: string;
  isConfirmed: boolean;
  isPublished: boolean;
};

export function FaqEditor({ items }: { items: FaqRow[] }) {
  const { pending, run, feedback } = useSaver();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <ul className="divide-cacao-line divide-y">
        {items.map((item) => (
          <li key={item.id} className="py-4">
            {editing === item.id ? (
              <FaqFields
                item={item}
                pending={pending}
                onSave={(formData) =>
                  run(async () => {
                    const result = await saveFaq(item.id, formData);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
                onCancel={() => setEditing(null)}
                onDelete={() => run(() => deleteFaq(item.id))}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.question}
                    {!item.isConfirmed && (
                      <span className="bg-energy-wash text-warning ml-2 rounded-full px-2 py-0.5 text-xs font-bold">
                        da confermare
                      </span>
                    )}
                    {!item.isPublished && (
                      <span className="bg-crema text-cacao-soft ml-2 rounded-full px-2 py-0.5 text-xs font-bold">
                        nascosta
                      </span>
                    )}
                  </p>
                  <p className="text-cacao-soft mt-1 line-clamp-2 text-sm">{item.answer}</p>
                  <p className="text-cacao-soft mt-1 text-xs">Gruppo: {item.group}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(item.id)}
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
          <FaqFields
            item={null}
            pending={pending}
            onSave={(formData) =>
              run(async () => {
                const result = await saveFaq(null, formData);
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
          Aggiungi domanda
        </Button>
      )}

      {feedback}
    </div>
  );
}

function FaqFields({
  item,
  pending,
  onSave,
  onCancel,
  onDelete,
}: {
  item: FaqRow | null;
  pending: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const key = item?.id ?? "new";

  return (
    <form action={onSave}>
      <div className="grid gap-3">
        <div>
          <Label htmlFor={`question-${key}`}>Domanda</Label>
          <input
            id={`question-${key}`}
            name="question"
            defaultValue={item?.question ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor={`answer-${key}`}>Risposta</Label>
          <textarea
            id={`answer-${key}`}
            name="answer"
            rows={4}
            defaultValue={item?.answer ?? ""}
            className={cn(inputClass, "h-auto py-3")}
          />
        </div>
        <div className="sm:max-w-xs">
          <Label htmlFor={`group-${key}`}>Gruppo</Label>
          <select
            id={`group-${key}`}
            name="group"
            defaultValue={item?.group ?? "prodotto"}
            className={cn(inputClass, "cursor-pointer")}
          >
            <option value="prodotto">Prodotto</option>
            <option value="spedizioni">Spedizioni</option>
            <option value="ordini">Ordini</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={item?.isPublished ?? true}
            className="accent-fiamma h-4 w-4"
          />
          Pubblicata
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="isConfirmed"
            defaultChecked={item?.isConfirmed ?? false}
            className="accent-success h-4 w-4"
          />
          Risposta confermata
        </label>
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

// --- Codici sconto -----------------------------------------------------------

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotalCents: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

export function CouponEditor({ coupons }: { coupons: CouponRow[] }) {
  const { pending, run, feedback } = useSaver();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <ul className="divide-cacao-line divide-y">
        {coupons.map((coupon) => (
          <li key={coupon.id} className="py-4">
            {editing === coupon.id ? (
              <CouponFields
                coupon={coupon}
                pending={pending}
                onSave={(formData) =>
                  run(async () => {
                    const result = await saveCoupon(coupon.id, formData);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
                onCancel={() => setEditing(null)}
                onDelete={() => run(() => deleteCoupon(coupon.id))}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display font-extrabold tracking-tight">
                    {coupon.code}
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-xs font-bold",
                        coupon.isActive
                          ? "bg-success/12 text-success"
                          : "bg-crema text-cacao-soft",
                      )}
                    >
                      {coupon.isActive ? "attivo" : "spento"}
                    </span>
                  </p>
                  <p className="text-cacao-soft text-sm">
                    {coupon.type === "PERCENT" && `−${coupon.value}%`}
                    {coupon.type === "FIXED" && `−${(coupon.value / 100).toFixed(2)} €`}
                    {coupon.type === "FREE_SHIPPING" && "Spedizione gratuita"}
                    {coupon.minSubtotalCents > 0 &&
                      ` · da ${(coupon.minSubtotalCents / 100).toFixed(2)} €`}
                    {` · usato ${coupon.usedCount} volte`}
                    {coupon.usageLimit && ` su ${coupon.usageLimit}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleCoupon(coupon.id))}
                    className="text-cacao-soft hover:text-cacao text-sm font-semibold underline underline-offset-2"
                  >
                    {coupon.isActive ? "Disattiva" : "Attiva"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(coupon.id)}
                    className="text-cacao-soft hover:text-cacao text-sm font-semibold underline underline-offset-2"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="border-cacao-line mt-4 border-t pt-4">
          <CouponFields
            coupon={null}
            pending={pending}
            onSave={(formData) =>
              run(async () => {
                const result = await saveCoupon(null, formData);
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
          Crea codice
        </Button>
      )}

      {feedback}
    </div>
  );
}

function CouponFields({
  coupon,
  pending,
  onSave,
  onCancel,
  onDelete,
}: {
  coupon: CouponRow | null;
  pending: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const key = coupon?.id ?? "new";
  const [type, setType] = useState(coupon?.type ?? "PERCENT");

  return (
    <form action={onSave}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`code-${key}`}>Codice</Label>
          <input
            id={`code-${key}`}
            name="code"
            defaultValue={coupon?.code ?? ""}
            placeholder="BENVENUTO10"
            className={cn(inputClass, "uppercase")}
          />
        </div>

        <div>
          <Label htmlFor={`type-${key}`}>Tipo</Label>
          <select
            id={`type-${key}`}
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={cn(inputClass, "cursor-pointer")}
          >
            <option value="PERCENT">Percentuale</option>
            <option value="FIXED">Importo fisso</option>
            <option value="FREE_SHIPPING">Spedizione gratuita</option>
          </select>
        </div>

        {type !== "FREE_SHIPPING" && (
          <div>
            <Label htmlFor={`value-${key}`}>
              {type === "PERCENT" ? "Percentuale (1-100)" : "Sconto (centesimi)"}
            </Label>
            <input
              id={`value-${key}`}
              name="value"
              type="number"
              min={1}
              defaultValue={coupon?.value ?? ""}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <Label htmlFor={`min-${key}`}>Spesa minima (centesimi)</Label>
          <input
            id={`min-${key}`}
            name="minSubtotalCents"
            type="number"
            min={0}
            defaultValue={coupon?.minSubtotalCents ?? 0}
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor={`limit-${key}`}>Utilizzi massimi</Label>
          <input
            id={`limit-${key}`}
            name="usageLimit"
            type="number"
            min={0}
            defaultValue={coupon?.usageLimit ?? 0}
            className={inputClass}
          />
          <p className="text-cacao-soft mt-1.5 text-xs">0 = nessun limite</p>
        </div>

        <div>
          <Label htmlFor={`expires-${key}`}>Scadenza</Label>
          <input
            id={`expires-${key}`}
            name="expiresAt"
            type="date"
            defaultValue={coupon?.expiresAt?.slice(0, 10) ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={coupon?.isActive ?? false}
          className="accent-fiamma h-4 w-4"
        />
        Attivo
      </label>

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
