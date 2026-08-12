"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Paginazione.
 *
 * Solo precedente/successiva più il conteggio: con liste che crescono di
 * qualche decina alla settimana, una fila di numeri di pagina occupa spazio
 * per un problema che non esiste ancora.
 */
export function Pagination({
  total,
  page,
  perPage,
}: {
  total: number;
  page: number;
  perPage: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  if (total <= perPage) return null;

  const linkTo = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target <= 1) params.delete("p");
    else params.set("p", String(target));
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const buttonClass = "rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors";

  return (
    <nav
      aria-label="Paginazione"
      className="border-cacao-line mt-5 flex items-center justify-between gap-4 border-t pt-4"
    >
      <p className="text-cacao-soft text-sm">
        {from}–{to} di {total}
      </p>

      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={linkTo(page - 1)} className={cn(buttonClass, "border-cacao-line hover:bg-crema")}>
            Precedente
          </Link>
        ) : (
          <span className={cn(buttonClass, "border-cacao-line text-cacao-soft opacity-40")}>
            Precedente
          </span>
        )}

        {page < lastPage ? (
          <Link href={linkTo(page + 1)} className={cn(buttonClass, "border-cacao-line hover:bg-crema")}>
            Successiva
          </Link>
        ) : (
          <span className={cn(buttonClass, "border-cacao-line text-cacao-soft opacity-40")}>
            Successiva
          </span>
        )}
      </div>
    </nav>
  );
}
