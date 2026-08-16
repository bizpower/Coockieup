"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cambiaPassword, type CambioPasswordState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const inputClass =
  "border-cacao-line bg-panna focus:border-cacao h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors";

function Invia() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="dark" size="sm" disabled={pending}>
      {pending ? "Salvo…" : "Cambia password"}
    </Button>
  );
}

export function PasswordForm() {
  const [stato, azione] = useActionState<CambioPasswordState, FormData>(
    cambiaPassword,
    {},
  );

  return (
    <form action={azione} className="max-w-md">
      <div className="grid gap-4">
        <div>
          <label
            htmlFor="attuale"
            className="mb-1.5 block text-sm font-semibold"
          >
            Password attuale
          </label>
          <input
            id="attuale"
            name="attuale"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="nuova" className="mb-1.5 block text-sm font-semibold">
            Nuova password
          </label>
          <input
            id="nuova"
            name="nuova"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            className={inputClass}
          />
          <p className="text-cacao-soft mt-1.5 text-xs">
            Almeno dodici caratteri. Una frase che ricordi vale più di otto
            simboli che dovrai riscrivere su un foglietto.
          </p>
        </div>
        <div>
          <label
            htmlFor="conferma"
            className="mb-1.5 block text-sm font-semibold"
          >
            Ripeti la nuova password
          </label>
          <input
            id="conferma"
            name="conferma"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Invia />
        <p aria-live="polite" className="min-h-5">
          {stato.message && (
            <span
              className={cn(
                "text-sm font-semibold",
                stato.ok ? "text-success" : "text-danger",
              )}
            >
              {stato.message}
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
