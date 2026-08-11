import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Larghezza massima e respiro laterale, identici in tutto il sito. */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-[1240px]",
        size === "wide" && "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Ritmo verticale delle sezioni, con il fondo scelto tra quelli del brand. */
export function Section({
  children,
  className,
  tone = "panna",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: "panna" | "crema" | "cacao";
  as?: ElementType;
} & { id?: string; "aria-labelledby"?: string }) {
  return (
    <Tag
      className={cn(
        "py-16 sm:py-24 lg:py-28",
        tone === "panna" && "bg-panna text-cacao",
        tone === "crema" && "bg-crema text-cacao grain",
        tone === "cacao" && "bg-cacao text-panna",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** L'etichetta maiuscola sopra i titoli di sezione. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow text-fiamma", className)}>{children}</p>;
}
