"use client";

import { useState, useTransition } from "react";
import { releaseStaleStock } from "@/app/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Scorte impegnate da ordini mai pagati.
 *
 * Compare solo quando ce ne sono: un avviso sempre presente diventa invisibile
 * dopo due giorni. Spiega anche il perché, perché "ordini bloccati" da solo non
 * dice a nessuno che il magazzino risulta più vuoto di quello che è.
 */
export function StaleStockNotice({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (count === 0 && !result) return null;

  return (
    <div className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3">
      {count > 0 && (
        <p className="text-sm leading-relaxed font-medium">
          <strong>
            {count} {count === 1 ? "ordine è rimasto" : "ordini sono rimasti"} da saldare da
            più di 48 ore.
          </strong>{" "}
          I pezzi restano impegnati e il magazzino risulta più vuoto di quello che è. La
          manutenzione notturna li libera da sola; se serve subito, fallo qui.
        </p>
      )}

      <Button
        type="button"
        variant="dark"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await releaseStaleStock()))}
      >
        {pending ? "Libero…" : "Libera le scorte adesso"}
      </Button>

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
    </div>
  );
}
