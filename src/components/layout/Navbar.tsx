"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MAIN_NAV } from "@/config/site";
import { LogoLink } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Navbar sticky.
 *
 * Trasparente in cima alla pagina, con fondo e bordo appena si scrolla: la hero
 * resta pulita e il menu resta leggibile sopra qualsiasi sezione.
 *
 * Il menu mobile è un pannello a tutto schermo. Chiude il body allo scroll,
 * si chiude col tasto Esc e al cambio di rotta.
 */
export function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cambio pagina: il pannello non deve restare aperto sotto la nuova rotta.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-panna/90 border-cacao-line border-b backdrop-blur-md" : "bg-transparent",
      )}
    >
      <nav
        aria-label="Navigazione principale"
        className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-6 px-5 sm:h-20 sm:px-8"
      >
        <LogoLink size="md" />

        <ul className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {MAIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "hover:decoration-fiamma rounded text-[0.9375rem] font-medium underline-offset-8 transition-colors hover:underline hover:decoration-2",
                    active ? "decoration-fiamma underline decoration-2" : "text-cacao-soft",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href="/cart"
            className="hover:bg-crema relative flex h-11 w-11 items-center justify-center rounded-full transition-colors"
            aria-label={
              cartCount > 0
                ? `Carrello, ${cartCount} ${cartCount === 1 ? "articolo" : "articoli"}`
                : "Carrello, vuoto"
            }
          >
            <CartIcon className="text-[1.35rem]" />
            {cartCount > 0 && (
              <span className="bg-fiamma text-cacao absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.6875rem] font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          <ButtonLink href="/shop" size="sm" className="hidden sm:inline-flex">
            Acquista ora
          </ButtonLink>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            className="hover:bg-crema flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden"
          >
            {open ? <CloseIcon className="text-2xl" /> : <MenuIcon className="text-2xl" />}
          </button>
        </div>
      </nav>

      {/* Pannello mobile */}
      <div
        id="menu-mobile"
        hidden={!open}
        className="bg-panna fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto sm:top-20 lg:hidden"
      >
        <ul className="flex flex-col px-5 py-4 sm:px-8">
          {MAIN_NAV.map((item, i) => (
            <li key={item.href} className={cn(i > 0 && "border-cacao-line border-t")}>
              <Link
                href={item.href}
                className="font-display block py-5 text-3xl font-extrabold tracking-tight"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 pb-10 sm:px-8">
          <ButtonLink href="/shop" size="lg" className="w-full">
            Acquista ora
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
