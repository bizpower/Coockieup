"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { lookupOrder, type LookupState } from "@/app/actions/order-lookup";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

const initial: LookupState = { status: "idle" };

/** Etichette in italiano per gli stati che nel database sono in inglese. */
const STATUS_LABEL: Record<string, string> = {
  PENDING: "In attesa di pagamento",
  PAID: "Pagato",
  PROCESSING: "In preparazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Cerco…" : "Trova l'ordine"}
    </Button>
  );
}

export function OrderLookup() {
  const [state, action] = useActionState(lookupOrder, initial);

  // Campi controllati di proposito: React azzera il modulo dopo una action, e
  // dopo un errore di battitura sull'email nessuno vuole ridigitare anche il
  // numero d'ordine copiato dalla ricevuta.
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lookup-number" className="mb-1.5 block text-sm font-semibold">
            Numero d&apos;ordine
          </label>
          <input
            id="lookup-number"
            name="number"
            required
            autoComplete="off"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="SG-2026-0001"
            className="border-cacao-line bg-panna focus:border-cacao h-12 w-full rounded-xl border-2 px-4 outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="lookup-email" className="mb-1.5 block text-sm font-semibold">
            Email dell&apos;ordine
          </label>
          <input
            id="lookup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-cacao-line bg-panna focus:border-cacao h-12 w-full rounded-xl border-2 px-4 outline-none transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <SubmitButton />
        </div>
      </form>

      <div aria-live="polite">
        {state.status === "error" && (
          <p className="border-danger bg-fiamma-wash text-danger mt-6 border-l-4 px-4 py-3 text-sm font-semibold">
            {state.message}
          </p>
        )}

        {state.status === "found" && state.order && (
          <article className="rounded-card bg-crema grain mt-8 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">
                {state.order.number}
              </h2>
              <Badge tone={state.order.status === "DELIVERED" ? "dark" : "brand"}>
                {STATUS_LABEL[state.order.status] ?? state.order.status}
              </Badge>
            </div>

            <p className="text-cacao-soft mt-2 text-sm">
              Ordine del{" "}
              {new Date(state.order.createdAt).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            {state.order.trackingCode && (
              <p className="mt-4 text-sm">
                Codice di tracciamento:{" "}
                <span className="font-bold">{state.order.trackingCode}</span>
              </p>
            )}

            <ul className="border-cacao-line divide-cacao-line mt-6 divide-y border-t">
              {state.order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-cacao-soft block text-xs">
                      {item.variant} × {item.quantity}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(item.totalCents)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="border-cacao-line mt-4 flex justify-between border-t pt-4">
              <span className="font-display font-extrabold">Totale</span>
              <span className="font-display font-extrabold tabular-nums">
                {formatPrice(state.order.totalCents)}
              </span>
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
