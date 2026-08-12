import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { Totals } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Riepilogo importi.
 *
 * Lo stesso componente per carrello, checkout e conferma d'ordine: le tre
 * pagine devono mostrare gli stessi numeri nello stesso ordine, e l'unico modo
 * per esserne certi è che sia letteralmente lo stesso codice.
 */
export function OrderSummary({
  totals,
  couponCode,
  children,
  className,
}: {
  totals: Totals;
  couponCode?: string | null;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card bg-crema grain p-6 sm:p-7", className)}>
      <h2 className="font-display text-xl font-extrabold tracking-tight">Riepilogo</h2>

      <dl className="mt-5 space-y-2.5 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-cacao-soft">Subtotale</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(totals.subtotalCents)}</dd>
        </div>

        {totals.discountCents > 0 && (
          <div className="text-success flex justify-between gap-4">
            <dt>Sconto{couponCode ? ` (${couponCode})` : ""}</dt>
            <dd className="font-semibold tabular-nums">−{formatPrice(totals.discountCents)}</dd>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <dt className="text-cacao-soft">Spedizione</dt>
          <dd className="font-semibold tabular-nums">
            {totals.shippingCents === 0 ? "Gratis" : formatPrice(totals.shippingCents)}
          </dd>
        </div>

        <div className="border-cacao-line flex justify-between gap-4 border-t pt-3 text-lg">
          <dt className="font-display font-extrabold">Totale</dt>
          <dd className="font-display font-extrabold tabular-nums">
            {formatPrice(totals.totalCents)}
          </dd>
        </div>
      </dl>

      <p className="text-cacao-soft mt-2 text-xs">IVA inclusa.</p>

      {children}
    </div>
  );
}
