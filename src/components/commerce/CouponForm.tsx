"use client";

import { useState, useTransition } from "react";
import { applyCoupon, removeCoupon } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";

/**
 * Codice sconto.
 *
 * L'errore del server viene mostrato per esteso — "il codice vale da 25 € in
 * su" invece di "codice non valido" — perché nove volte su dieci il codice è
 * giusto e manca solo qualcosa nel carrello.
 */
export function CouponForm({
  appliedCode,
  errorFromTotals,
}: {
  appliedCode: string | null;
  errorFromTotals: string | null;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApply(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await applyCoupon(code);
      setMessage(result.message ?? null);
      if (result.ok) setCode("");
    });
  }

  if (appliedCode && !errorFromTotals) {
    return (
      <div className="rounded-card bg-crema flex items-center justify-between gap-4 px-4 py-3.5">
        <p className="text-sm">
          Codice <span className="font-bold">{appliedCode}</span> applicato.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void removeCoupon())}
          className="text-cacao-soft hover:text-danger text-sm font-semibold underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          Rimuovi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply}>
      <label htmlFor="coupon" className="text-cacao-soft block text-sm font-semibold">
        Hai un codice sconto?
      </label>

      <div className="mt-2 flex gap-2">
        <input
          id="coupon"
          name="coupon"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          placeholder="CODICE"
          aria-describedby="coupon-esito"
          className="border-cacao-line bg-panna focus:border-cacao h-11 min-w-0 flex-1 rounded-full border-2 px-4 text-sm uppercase outline-none transition-colors"
        />
        <Button type="submit" variant="dark" size="sm" disabled={pending || !code.trim()}>
          {pending ? "…" : "Applica"}
        </Button>
      </div>

      <p id="coupon-esito" aria-live="polite" className="min-h-5">
        {(message || errorFromTotals) && (
          <span className="text-danger mt-2 inline-block text-sm font-semibold">
            {errorFromTotals ?? message}
          </span>
        )}
      </p>
    </form>
  );
}
