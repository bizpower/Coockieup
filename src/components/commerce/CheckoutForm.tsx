"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initial: CheckoutState = { status: "idle" };

function Field({
  name,
  label,
  error,
  type = "text",
  autoComplete,
  required,
  className,
  inputMode,
  maxLength,
  defaultValue,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
  defaultValue?: string;
}) {
  const id = useId();
  const errorId = `${id}-errore`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {!required && <span className="text-cacao-soft font-normal"> (facoltativo)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "bg-panna h-12 w-full rounded-xl border-2 px-4 outline-none transition-colors",
          error ? "border-danger" : "border-cacao-line focus:border-cacao",
        )}
      />
      {error && (
        <p id={errorId} className="text-danger mt-1.5 text-sm font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Registro l'ordine…" : label}
    </Button>
  );
}

/**
 * Dati di spedizione e conferma dell'ordine.
 *
 * Un solo passo, non tre schermate: con un prodotto e un metodo di spedizione,
 * spezzare il checkout aggiungerebbe solo occasioni di abbandono. La
 * validazione è la stessa del server — è lo stesso schema Zod — e gli errori
 * tornano ancorati al campo che li ha generati.
 */
export function CheckoutForm({ payLabel }: { payLabel: string }) {
  const [state, action] = useActionState(placeOrder, initial);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form action={action} noValidate>
      <fieldset>
        <legend className="font-display text-xl font-extrabold tracking-tight">Contatti</legend>
        <div className="mt-4">
          <Field
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            error={errors.email}
            defaultValue={values.email}
          />
          <p className="text-cacao-soft mt-1.5 text-sm">
            Ci mandiamo la conferma e il codice di tracciamento. Nient&apos;altro.
          </p>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="font-display text-xl font-extrabold tracking-tight">Spedizione</legend>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="name"
            label="Nome e cognome"
            autoComplete="name"
            required
            error={errors.name}
            defaultValue={values.name}
            className="sm:col-span-2"
          />
          <Field
            name="line1"
            label="Indirizzo"
            autoComplete="address-line1"
            required
            error={errors.line1}
            defaultValue={values.line1}
            className="sm:col-span-2"
          />
          <Field
            name="line2"
            label="Scala, interno, citofono"
            autoComplete="address-line2"
            error={errors.line2}
            defaultValue={values.line2}
            className="sm:col-span-2"
          />
          <Field
            name="zip"
            label="CAP"
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            required
            error={errors.zip}
            defaultValue={values.zip}
          />
          <Field
            name="city"
            label="Città"
            autoComplete="address-level2"
            required
            error={errors.city}
            defaultValue={values.city}
          />
          <Field
            name="state"
            label="Provincia"
            autoComplete="address-level1"
            maxLength={60}
            error={errors.state}
            defaultValue={values.state}
          />
          <Field
            name="phone"
            label="Telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
            defaultValue={values.phone}
          />
        </div>

        <input type="hidden" name="country" value="IT" />
        <p className="text-cacao-soft mt-3 text-sm">
          Al momento spediamo solo in Italia.
        </p>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="font-display text-xl font-extrabold tracking-tight">Note</legend>
        <label htmlFor="customerNote" className="sr-only">
          Note per la consegna
        </label>
        <textarea
          id="customerNote"
          name="customerNote"
          rows={3}
          maxLength={500}
          defaultValue={values.customerNote}
          placeholder="Qualcosa che dobbiamo sapere per la consegna?"
          className="border-cacao-line bg-panna focus:border-cacao mt-4 w-full rounded-xl border-2 p-4 outline-none transition-colors"
        />
      </fieldset>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="marketingConsent"
          className="accent-fiamma mt-0.5 h-4 w-4 shrink-0"
        />
        <span className="text-cacao-soft">
          Voglio ricevere la newsletter: gusti nuovi e anteprime, niente di più.
        </span>
      </label>

      <div aria-live="polite" className="min-h-6">
        {state.status === "error" && state.message && (
          <p className="border-danger bg-fiamma-wash text-danger mt-5 border-l-4 px-4 py-3 text-sm font-semibold">
            {state.message}
          </p>
        )}
      </div>

      <div className="mt-6">
        <SubmitButton label={payLabel} />
      </div>
    </form>
  );
}
