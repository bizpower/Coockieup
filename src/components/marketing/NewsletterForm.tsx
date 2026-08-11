"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initial: NewsletterState = { status: "idle" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="sm:w-auto">
      {pending ? "Un attimo…" : label}
    </Button>
  );
}

export function NewsletterForm({
  cta,
  consent,
  source = "footer",
  inverted,
}: {
  cta: string;
  consent: string;
  source?: string;
  inverted?: boolean;
}) {
  const [state, action] = useActionState(subscribeToNewsletter, initial);

  const fieldClass = cn(
    "h-14 w-full rounded-pill border-2 px-5 text-base outline-none transition-colors",
    "placeholder:text-cacao-soft/70",
    inverted
      ? "border-panna/30 bg-transparent text-panna placeholder:text-panna/60 focus:border-fiamma"
      : "border-cacao-line bg-panna text-cacao focus:border-cacao",
  );

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-name" className="sr-only">
          Nome
        </label>
        <input
          id="newsletter-name"
          name="name"
          type="text"
          autoComplete="given-name"
          placeholder="Nome"
          className={cn(fieldClass, "sm:max-w-[11rem]")}
        />

        <label htmlFor="newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="La tua email"
          aria-describedby="newsletter-consent"
          className={cn(fieldClass, "sm:flex-1")}
        />

        <SubmitButton label={cta} />
      </div>

      {/* Un solo live region: l'esito arriva agli screen reader senza rubare il focus. */}
      <p aria-live="polite" className="min-h-6">
        {state.status !== "idle" && (
          <span
            className={cn(
              "mt-3 inline-block text-sm font-semibold",
              state.status === "success"
                ? inverted
                  ? "text-energy"
                  : "text-success"
                : "text-danger",
            )}
          >
            {state.message}
          </span>
        )}
      </p>

      <p
        id="newsletter-consent"
        className={cn("mt-2 text-xs", inverted ? "text-panna/60" : "text-cacao-soft")}
      >
        {consent}
      </p>
    </form>
  );
}
