"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Ricerca che scrive nell'indirizzo.
 *
 * Tenere la query nella URL invece che nello stato del componente significa
 * che una ricerca si può mettere nei preferiti, ricaricare e incollare a un
 * collega. Il ritardo di 350 ms evita una richiesta per ogni tasto premuto.
 */
export function AdminSearch({ placeholder = "Cerca…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      // Una nuova ricerca riparte dalla prima pagina: restare a pagina 4 di
      // risultati che non esistono più è il classico "non funziona".
      params.delete("p");

      startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
    }, 350);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="min-w-[14rem] flex-1">
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="admin-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="border-cacao-line bg-panna focus:border-cacao h-10 w-full rounded-lg border px-3.5 text-sm outline-none transition-colors"
      />
    </div>
  );
}
