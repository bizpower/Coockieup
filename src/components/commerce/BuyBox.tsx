"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { discountPercent, formatPrice, formatUnitPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartUI } from "./CartUIProvider";
import { QuantityStepper } from "./QuantityStepper";

/**
 * Il blocco d'acquisto: formato, quantità, aggiungi al carrello.
 *
 * Sta tutto in un componente perché le tre cose sono un'unica decisione: il
 * prezzo dipende dal formato, il massimo acquistabile dipende dalla giacenza
 * del formato scelto, e separarli obbligherebbe a rimbalzare stato fra
 * componenti fratelli per nessun guadagno.
 */

export type BuyBoxVariant = {
  id: string;
  sku: string;
  name: string;
  boxCount: number;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  badge: string | null;
  isDefault: boolean;
};

export function BuyBox({
  variants,
  productName,
  unitsPerBox,
  initialSku,
}: {
  variants: BuyBoxVariant[];
  productName: string;
  unitsPerBox: number;
  initialSku?: string;
}) {
  const preferred =
    variants.find((v) => v.sku === initialSku) ??
    variants.find((v) => v.isDefault) ??
    variants[0];

  const [selectedId, setSelectedId] = useState(preferred?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { openCart } = useCartUI();

  const selected = variants.find((v) => v.id === selectedId) ?? preferred;

  if (!selected) {
    return (
      <p className="text-cacao-soft rounded-card bg-crema p-5 text-sm">
        Questo prodotto non ha formati disponibili al momento.
      </p>
    );
  }

  const soldOut = selected.stock <= 0;
  const lowStock = !soldOut && selected.stock <= 10;
  const saving = discountPercent(selected.priceCents, selected.compareAtCents);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addToCart({ variantId: selected!.id, quantity });
      if (result.ok) {
        setQuantity(1);
        openCart();
      } else {
        setError(
          result.message ?? "Non siamo riusciti ad aggiungerlo al carrello.",
        );
      }
    });
  }

  return (
    <div>
      <fieldset>
        <legend className="eyebrow text-cacao-soft mb-3">
          Scegli il formato
        </legend>

        <div className="grid gap-2.5">
          {variants.map((variant) => {
            const active = variant.id === selected.id;
            const unavailable = variant.stock <= 0;
            const variantSaving = discountPercent(
              variant.priceCents,
              variant.compareAtCents,
            );

            return (
              <label
                key={variant.id}
                className={cn(
                  "rounded-card flex cursor-pointer items-center gap-4 border-2 px-4 py-3.5 transition-colors",
                  active
                    ? "border-fiamma bg-fiamma-wash"
                    : "border-cacao-line hover:border-cacao",
                  unavailable && "opacity-55",
                  "focus-within:outline-fiamma focus-within:outline focus-within:outline-2 focus-within:outline-offset-2",
                )}
              >
                <input
                  type="radio"
                  name="variante"
                  value={variant.id}
                  checked={active}
                  onChange={() => {
                    setSelectedId(variant.id);
                    setQuantity(1);
                    setError(null);
                  }}
                  className="sr-only"
                />

                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-fiamma" : "border-cacao-line",
                  )}
                >
                  {active && (
                    <span className="bg-fiamma h-2.5 w-2.5 rounded-full" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{variant.name}</span>
                    {variant.badge && !unavailable && (
                      <Badge tone={active ? "brand" : "neutral"}>
                        {variant.badge}
                      </Badge>
                    )}
                    {unavailable && <Badge tone="outline">Esaurito</Badge>}
                  </span>
                  <span className="text-cacao-soft block text-sm">
                    {variant.boxCount * unitsPerBox} mini cookie
                    {variant.boxCount > 1 && (
                      <>
                        {" "}
                        ·{" "}
                        {formatUnitPrice(
                          variant.priceCents,
                          variant.boxCount,
                        )}{" "}
                        a confezione
                      </>
                    )}
                  </span>
                </span>

                <span className="text-right">
                  <span className="font-display block font-extrabold tabular-nums">
                    {formatPrice(variant.priceCents)}
                  </span>
                  {variantSaving && (
                    <span className="text-cacao-soft block text-xs line-through tabular-nums">
                      {formatPrice(variant.compareAtCents!)}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* `flex-wrap`: prezzo, prezzo barrato e pastiglia dello sconto su uno
          schermo da 320px non stanno su una riga sola, e senza il ritorno a
          capo la pastiglia usciva dallo schermo trascinandosi dietro la
          pagina. */}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="font-display text-4xl font-extrabold tracking-tight tabular-nums">
          {formatPrice(selected.priceCents * quantity)}
        </span>
        {saving && (
          <>
            <span className="text-cacao-soft text-lg line-through tabular-nums">
              {formatPrice(selected.compareAtCents! * quantity)}
            </span>
            <Badge tone="dark">Risparmi {saving}%</Badge>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantityStepper
          value={quantity}
          max={Math.min(selected.stock, 20)}
          onChange={setQuantity}
          disabled={soldOut || pending}
          label={`${productName} ${selected.name}`}
        />

        <Button
          size="lg"
          onClick={handleAdd}
          disabled={soldOut || pending}
          className="flex-1"
          aria-describedby={error ? "buybox-errore" : undefined}
        >
          {soldOut
            ? "Esaurito"
            : pending
              ? "Aggiungo…"
              : "Aggiungi al carrello"}
        </Button>
      </div>

      <p aria-live="polite" className="min-h-6">
        {error && (
          <span
            id="buybox-errore"
            className="text-danger mt-3 inline-block text-sm font-semibold"
          >
            {error}
          </span>
        )}
        {!error && lowStock && (
          <span className="text-warning mt-3 inline-block text-sm font-semibold">
            Ne restano {selected.stock}.
          </span>
        )}
      </p>
    </div>
  );
}
