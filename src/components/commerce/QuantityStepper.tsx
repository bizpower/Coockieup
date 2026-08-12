"use client";

import { cn } from "@/lib/utils";

/**
 * Selettore di quantità.
 *
 * Il numero al centro è un `<output>`, non un input: la quantità si cambia con
 * i due pulsanti, che hanno un'etichetta esplicita per gli screen reader. Un
 * campo di testo libero qui produrrebbe solo valori da validare e tastiere
 * numeriche aperte per sbaglio su mobile.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = 20,
  onChange,
  disabled,
  size = "md",
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label: string;
}) {
  const buttonClass = cn(
    "flex items-center justify-center rounded-full transition-colors",
    "hover:bg-crema-deep disabled:opacity-35 disabled:hover:bg-transparent",
    size === "sm" ? "h-8 w-8 text-lg" : "h-10 w-10 text-xl",
  );

  return (
    <div
      className={cn(
        "border-cacao-line inline-flex items-center gap-1 rounded-full border",
        size === "sm" ? "p-0.5" : "p-1",
      )}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Riduci la quantità di ${label}`}
      >
        <span aria-hidden="true">−</span>
      </button>

      <output
        className={cn(
          "text-center font-semibold tabular-nums",
          size === "sm" ? "w-6 text-sm" : "w-8",
        )}
        aria-label={`Quantità di ${label}: ${value}`}
      >
        {value}
      </output>

      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Aumenta la quantità di ${label}`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
