"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeCartLine, updateCartLine } from "@/app/actions/cart";
import { PackStack } from "@/components/brand/PackShot";
import { formatPrice } from "@/lib/format";
import type { CartLineView } from "@/services/cart";
import { QuantityStepper } from "./QuantityStepper";

/** Le righe del carrello nella pagina intera, con più respiro del pannello laterale. */
export function CartLines({ lines }: { lines: CartLineView[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="border-cacao-line divide-cacao-line divide-y border-y">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-5 py-6 sm:gap-7">
          <div className="bg-crema rounded-card w-24 shrink-0 p-3 sm:w-32">
            <PackStack count={line.boxCount} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
              <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
                <Link href={`/product/${line.productSlug}`} className="hover:text-fiamma transition-colors">
                  {line.name}
                </Link>
              </h2>
              <p className="font-display font-extrabold tabular-nums">
                {formatPrice(line.lineTotalCents)}
              </p>
            </div>

            <p className="text-cacao-soft text-sm">
              {line.variantName} · {formatPrice(line.unitPriceCents)} l&apos;uno
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
              <QuantityStepper
                value={line.quantity}
                max={Math.min(line.stock, 20)}
                label={`${line.name} ${line.variantName}`}
                disabled={pending}
                onChange={(next) =>
                  startTransition(() => {
                    void updateCartLine(line.id, next);
                  })
                }
              />

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => {
                    void removeCartLine(line.id);
                  })
                }
                className="text-cacao-soft hover:text-danger text-sm font-semibold underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                Rimuovi
              </button>

              {line.stock <= 10 && (
                <span className="text-warning text-sm font-semibold">
                  Ne restano {line.stock}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
