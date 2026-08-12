import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";
import { wordmark } from "./wordmark";
import { cn } from "@/lib/utils";

/**
 * Il marchio è tipografico, non un'immagine.
 *
 * Un logotipo composto dal carattere display si ridisegna da solo cambiando
 * BRAND_NAME, resta nitido a ogni misura e non ha una versione a bassa
 * risoluzione da inseguire.
 *
 * Il segno è la seconda metà del nome: `Up` in fiamma, sollevata di un soffio
 * dalla linea di base. È il punteggio che sale quando prendi il power-up,
 * ottenuto spostando due lettere invece di disegnare una freccia.
 */

const SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

type LogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  /** Sul fondo cacao il wordmark diventa panna. */
  inverted?: boolean;
};

export function Logo({ size = "md", className, inverted }: LogoProps) {
  const { lead, accent, kind } = wordmark();
  return (
    <span
      className={cn(
        "font-display inline-flex items-baseline font-extrabold leading-none tracking-[-0.045em]",
        // Un nome in camelCase va letto come è scritto: forzarlo maiuscolo
        // ("COOKIEUP") gli toglierebbe proprio la giuntura che lo rende
        // leggibile in un colpo d'occhio.
        kind === "dot" && "uppercase",
        SIZES[size],
        inverted ? "text-panna" : "text-cacao",
        className,
      )}
    >
      {lead}
      <span
        className={cn("text-fiamma", kind === "camel" && "-translate-y-[0.07em]")}
        aria-hidden={kind === "dot" ? true : undefined}
      >
        {accent}
      </span>
    </span>
  );
}

export function LogoLink({ size, inverted, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND_NAME} — ${BRAND_TAGLINE}, torna alla home`}
      className={cn("inline-flex rounded", className)}
    >
      <Logo size={size} inverted={inverted} />
    </Link>
  );
}
