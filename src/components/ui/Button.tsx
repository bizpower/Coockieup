import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Il bottone primario è fondo `fiamma` con testo `cacao`.
 *
 * Il bianco su arancio si ferma a 3.4:1 e non passa l'AA; il cacao arriva a
 * 5.1:1. Il contrasto qui non è un ripiego: l'arancio con il testo scuro è più
 * "food" e meno "software" del solito bottone bianco su colore.
 */

const VARIANTS = {
  primary:
    "bg-fiamma text-cacao hover:bg-fiamma-deep hover:text-panna shadow-soft hover:shadow-lift",
  dark: "bg-cacao text-panna hover:bg-cacao-soft",
  outline: "border-2 border-cacao text-cacao hover:bg-cacao hover:text-panna",
  ghost: "text-cacao hover:bg-crema",
  invertedOutline: "border-2 border-panna text-panna hover:bg-panna hover:text-cacao",
} as const;

const SIZES = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
} as const;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold tracking-tight " +
  "transition-all duration-200 ease-[var(--ease-out-soft)] " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

type Common = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & ComponentProps<"button">) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </Link>
  );
}
