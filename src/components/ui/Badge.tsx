import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-crema text-cacao-soft",
  brand: "bg-fiamma text-cacao",
  dark: "bg-cacao text-panna",
  outline: "border border-cacao-line text-cacao-soft",
  warning: "bg-energy-wash text-warning border border-warning/30",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wide uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Il badge dei dati non validati.
 *
 * Compare ovunque `isConfirmed` sia false: valori nutrizionali, ingredienti,
 * allergeni, FAQ. È voluto che si veda — finché la ricetta non è chiusa il sito
 * non deve poter sembrare più sicuro di quanto sia.
 */
export function UnconfirmedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="warning" className={cn("gap-1", className)}>
      <span aria-hidden="true">•</span>
      Da confermare
    </Badge>
  );
}
