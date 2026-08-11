import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Il marchio è tipografico, non un'immagine.
 *
 * È una scelta obbligata e insieme corretta: finché il nome non è deciso, un
 * logotipo disegnato sarebbe da rifare. Un wordmark composto dal carattere
 * display si riscrive cambiando BRAND_NAME, e il punto in `fiamma` resta il
 * segno riconoscibile qualunque nome vinca.
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
  return (
    <span
      className={cn(
        "font-display inline-flex items-baseline font-extrabold uppercase leading-none tracking-[-0.045em]",
        SIZES[size],
        inverted ? "text-panna" : "text-cacao",
        className,
      )}
    >
      {BRAND_NAME}
      <span className="text-fiamma" aria-hidden="true">
        .
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

/**
 * Bollino da packaging: il timbro tondo che nei brand food italiani porta la
 * promessa breve. Testo su righe, non su tracciato curvo, per restare leggibile
 * anche a 64px e non introdurre id duplicati nel DOM.
 */
export function BrandSeal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "border-cacao text-cacao flex aspect-square flex-col items-center justify-center rounded-full border-2 text-center",
        className,
      )}
      aria-hidden="true"
    >
      <span className="font-display text-[0.7em] font-extrabold leading-none">15</span>
      <span className="mt-[0.15em] text-[0.28em] font-bold uppercase leading-[1.2] tracking-[0.12em]">
        mini
        <br />
        cookie
      </span>
    </span>
  );
}
