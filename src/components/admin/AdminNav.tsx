"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Navigazione dell'area amministrativa.
 *
 * Raggruppata per attività, non per modello di dati: chi entra la mattina
 * pensa "devo spedire un ordine" o "devo scrivere un articolo", non
 * "devo aprire la tabella OrderItem".
 */

const SECTIONS = [
  {
    title: "Negozio",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/orders", label: "Ordini" },
      { href: "/admin/customers", label: "Clienti" },
      { href: "/admin/products", label: "Prodotti" },
      { href: "/admin/coupons", label: "Codici sconto" },
    ],
  },
  {
    title: "Contenuti",
    items: [
      { href: "/admin/blog", label: "Magazine" },
      { href: "/admin/media", label: "Media" },
      { href: "/admin/content", label: "Testi del sito" },
      { href: "/admin/faq", label: "FAQ" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/newsletter", label: "Newsletter" },
      { href: "/admin/settings", label: "Impostazioni" },
    ],
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-7">
          <p className="eyebrow text-panna/40 px-3">{section.title}</p>
          <ul className="mt-2 space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-fiamma text-cacao"
                        : "text-panna/75 hover:bg-panna/10 hover:text-panna",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Barra mobile */}
      <div className="bg-cacao text-panna sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo size="sm" inverted />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? "Chiudi il menu" : "Apri il menu"}
          className="hover:bg-panna/10 flex h-10 w-10 items-center justify-center rounded-lg"
        >
          {open ? <CloseIcon className="text-xl" /> : <MenuIcon className="text-xl" />}
        </button>
      </div>

      <aside
        id="admin-nav"
        className={cn(
          "bg-cacao text-panna flex w-full shrink-0 flex-col p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="mb-8 hidden px-3 pt-3 lg:block">
          <Logo size="md" inverted />
          <p className="text-panna/40 mt-1 text-xs font-semibold">Amministrazione</p>
        </div>

        <nav aria-label="Sezioni amministrative" className="flex-1 overflow-y-auto">
          {nav}
        </nav>

        <div className="border-panna/15 mt-4 border-t px-3 pt-4">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <p className="text-panna/40 text-xs">{userRole === "ADMIN" ? "Amministratore" : "Redazione"}</p>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-panna/60 hover:text-fiamma text-xs font-semibold underline-offset-2 hover:underline"
            >
              Vedi il sito
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-panna/60 hover:text-fiamma text-xs font-semibold underline-offset-2 hover:underline"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
