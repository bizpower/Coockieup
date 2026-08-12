import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Quanto manca alla spedizione gratuita.
 *
 * La barra è decorativa e nascosta agli screen reader: l'informazione è già
 * nel testo sopra, e sentirsi leggere "progressbar 62%" non aggiunge niente a
 * "ti mancano 14,80 €".
 */
export function FreeShippingMeter({
  missingCents,
  thresholdCents,
  className,
}: {
  missingCents: number;
  thresholdCents: number;
  className?: string;
}) {
  const reached = missingCents <= 0;
  const progress = reached
    ? 100
    : Math.min(100, Math.round(((thresholdCents - missingCents) / thresholdCents) * 100));

  return (
    <div className={cn("rounded-card bg-crema px-4 py-3", className)}>
      <p className="text-sm font-semibold">
        {reached ? (
          <>
            Spedizione gratuita sbloccata. <span aria-hidden="true">🎉</span>
          </>
        ) : (
          <>
            Ti mancano <span className="text-fiamma">{formatPrice(missingCents)}</span> alla
            spedizione gratuita.
          </>
        )}
      </p>
      <div className="bg-crema-deep mt-2.5 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-soft)]",
            reached ? "bg-success" : "bg-fiamma",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
