"use client";

import { useState, useTransition } from "react";
import { resendOrderConfirmation } from "@/app/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Stato dell'email di conferma.
 *
 * Sta nel dettaglio ordine perché è la prima cosa che serve sapere quando un
 * cliente scrive "non ho ricevuto niente": qui si vede se è partita, quando, e
 * se no perché — senza dover cercare nei log del server.
 */
export function OrderEmailPanel({
  orderId,
  email,
  sentAt,
  error,
}: {
  orderId: string;
  email: string;
  sentAt: string | null;
  error: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div>
      {sentAt ? (
        <p className="text-sm">
          <span className="text-success font-semibold">Inviata</span> a {email}
          <span className="text-cacao-soft block text-xs">
            {new Date(sentAt).toLocaleString("it-IT")}
          </span>
        </p>
      ) : (
        <p className="text-sm">
          <span className="text-warning font-semibold">Non inviata</span> a {email}
          {error && (
            <span className="text-cacao-soft mt-1 block text-xs leading-relaxed">{error}</span>
          )}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setResult(await resendOrderConfirmation(orderId)))
        }
      >
        {pending ? "Invio…" : sentAt ? "Rimanda" : "Riprova l'invio"}
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
