"use client";

import { useState, useTransition } from "react";
import { updateOrderNotes, updateOrderStatus } from "@/app/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS } from "./ui";
import { cn } from "@/lib/utils";

const FLOW = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const EXITS = ["CANCELLED", "REFUNDED"] as const;

/**
 * Avanzamento dell'ordine e dati di spedizione.
 *
 * Gli stati sono presentati come un percorso, non come una tendina: chi
 * prepara i pacchi ragiona per passi successivi. Annullamento e rimborso
 * stanno separati, perché non sono "il passo dopo" — e perché rimettono a
 * scaffale la merce.
 */
export function OrderActions({
  orderId,
  status,
  trackingCode,
  adminNote,
}: {
  orderId: string;
  status: string;
  trackingCode: string | null;
  adminNote: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const currentIndex = FLOW.indexOf(status as (typeof FLOW)[number]);
  const closed = status === "CANCELLED" || status === "REFUNDED";

  function change(next: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      setMessage(result.message ?? null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FLOW.map((step, index) => {
          const isCurrent = step === status;
          const isPast = currentIndex >= 0 && index < currentIndex;

          return (
            <button
              key={step}
              type="button"
              disabled={pending || isCurrent || closed}
              onClick={() => change(step)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-default",
                isCurrent && "bg-fiamma text-cacao",
                isPast && !isCurrent && "bg-crema text-cacao-soft",
                !isCurrent && !isPast && "border-cacao-line hover:border-cacao border",
                closed && !isCurrent && "opacity-40",
              )}
            >
              {STATUS_LABELS[step]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXITS.map((step) => (
          <button
            key={step}
            type="button"
            disabled={pending || status === step}
            onClick={() => change(step)}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
              status === step
                ? "bg-cacao text-panna"
                : "text-cacao-soft hover:text-danger hover:border-danger border-cacao-line border disabled:opacity-40",
            )}
          >
            {STATUS_LABELS[step]}
          </button>
        ))}
      </div>

      <p className="text-cacao-soft mt-3 text-xs leading-relaxed">
        Annullare o rimborsare rimette automaticamente a scaffale i pezzi di questo ordine.
      </p>

      <form
        action={(formData) =>
          startTransition(async () => {
            const result = await updateOrderNotes(orderId, formData);
            setMessage(result.message ?? null);
          })
        }
        className="border-cacao-line mt-6 border-t pt-5"
      >
        <label htmlFor="trackingCode" className="mb-1.5 block text-sm font-semibold">
          Codice di tracciamento
        </label>
        <input
          id="trackingCode"
          name="trackingCode"
          defaultValue={trackingCode ?? ""}
          className="border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors"
        />
        <p className="text-cacao-soft mt-1.5 text-xs">
          Compare al cliente nella pagina &laquo;I miei ordini&raquo;.
        </p>

        <label htmlFor="adminNote" className="mt-4 mb-1.5 block text-sm font-semibold">
          Nota interna
        </label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          defaultValue={adminNote ?? ""}
          placeholder="Visibile solo qui dentro."
          className="border-cacao-line bg-panna focus:border-cacao w-full rounded-lg border p-3.5 text-sm outline-none transition-colors"
        />

        <Button type="submit" variant="dark" size="sm" className="mt-3" disabled={pending}>
          Salva
        </Button>
      </form>

      <p aria-live="polite" className="min-h-5">
        {message && <span className="text-success mt-3 inline-block text-sm font-semibold">{message}</span>}
      </p>
    </div>
  );
}
