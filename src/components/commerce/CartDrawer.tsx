"use client";

import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { removeCartLine, updateCartLine } from "@/app/actions/cart";
import { PackStack } from "@/components/brand/PackShot";
import { ButtonLink } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartView } from "@/services/cart";
import { useCartUI } from "./CartUIProvider";
import { QuantityStepper } from "./QuantityStepper";
import { FreeShippingMeter } from "./FreeShippingMeter";

/**
 * Carrello laterale.
 *
 * Il contenuto arriva dal server: dopo ogni azione la revalidazione riporta
 * qui i nuovi dati, quindi non esiste una copia locale che possa divergere.
 * `useTransition` tiene il pannello utilizzabile mentre l'azione è in volo,
 * senza spinner che coprono tutto.
 */
export function CartDrawer({ cart }: { cart: CartView }) {
  const { open, closeCart } = useCartUI();
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
        return;
      }

      // Il focus resta dentro il pannello: con un dialog aperto, tabulare
      // fino ai link della pagina sotto è disorientante da tastiera.
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, closeCart]);

  const empty = cart.lines.length === 0;

  return (
    <>
      <div
        className={cn(
          "bg-cacao/40 fixed inset-0 z-[60] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrello"
        aria-hidden={!open}
        className={cn(
          "bg-panna fixed top-0 right-0 z-[70] flex h-dvh w-full max-w-[26rem] flex-col shadow-2xl",
          "transition-transform duration-300 ease-[var(--ease-out-soft)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="border-cacao-line flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            Carrello
            {cart.itemCount > 0 && (
              <span className="text-cacao-soft ml-2 text-base font-semibold">
                ({cart.itemCount})
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Chiudi il carrello"
            className="hover:bg-crema flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <CloseIcon className="text-xl" />
          </button>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="w-32 opacity-40">
              <PackStack count={1} />
            </div>
            <p className="font-display mt-6 text-xl font-extrabold tracking-tight">
              Qui non c&apos;è niente.
            </p>
            <p className="text-cacao-soft mt-2 text-sm">
              Il che, a pensarci, è un problema facile da risolvere.
            </p>
            <ButtonLink href="/shop" className="mt-6" onClick={closeCart}>
              Vai allo shop
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {cart.totals.freeShippingThresholdCents !== null && (
                <FreeShippingMeter
                  missingCents={cart.totals.toFreeShippingCents}
                  thresholdCents={cart.totals.freeShippingThresholdCents}
                  className="mt-4"
                />
              )}

              <ul className="divide-cacao-line divide-y">
                {cart.lines.map((line) => (
                  <li key={line.id} className="flex gap-4 py-5">
                    <Link
                      href={`/product/${line.productSlug}`}
                      onClick={closeCart}
                      className="bg-crema rounded-card w-20 shrink-0 p-2"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <PackStack count={line.boxCount} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${line.productSlug}`}
                        onClick={closeCart}
                        className="hover:text-fiamma font-semibold transition-colors"
                      >
                        {line.name}
                      </Link>
                      <p className="text-cacao-soft text-sm">{line.variantName}</p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <QuantityStepper
                          size="sm"
                          value={line.quantity}
                          max={Math.min(line.stock, 20)}
                          label={`${line.name} ${line.variantName}`}
                          disabled={pending}
                          onChange={(next) =>
                            startTransition(() => {
                              void updateCartLine(line.id, next);
                            })
                          }
                        />
                        <span className="font-semibold tabular-nums">
                          {formatPrice(line.lineTotalCents)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => {
                            void removeCartLine(line.id);
                          })
                        }
                        className="text-cacao-soft hover:text-danger mt-2 text-xs font-semibold underline underline-offset-2 transition-colors disabled:opacity-50"
                      >
                        Rimuovi
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-cacao-line bg-crema border-t px-5 py-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-cacao-soft">Subtotale</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatPrice(cart.totals.subtotalCents)}
                  </dd>
                </div>
                {cart.totals.discountCents > 0 && (
                  <div className="text-success flex justify-between">
                    <dt>Sconto {cart.couponCode && `(${cart.couponCode})`}</dt>
                    <dd className="font-semibold tabular-nums">
                      −{formatPrice(cart.totals.discountCents)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-cacao-soft">Spedizione</dt>
                  <dd className="font-semibold tabular-nums">
                    {cart.totals.shippingCents === 0
                      ? "Gratis"
                      : formatPrice(cart.totals.shippingCents)}
                  </dd>
                </div>
                <div className="border-cacao-line flex justify-between border-t pt-2.5 text-base">
                  <dt className="font-display font-extrabold">Totale</dt>
                  <dd className="font-display font-extrabold tabular-nums">
                    {formatPrice(cart.totals.totalCents)}
                  </dd>
                </div>
              </dl>

              <ButtonLink href="/checkout" size="lg" className="mt-4 w-full" onClick={closeCart}>
                Vai alla cassa
              </ButtonLink>
              <button
                type="button"
                onClick={closeCart}
                className="text-cacao-soft hover:text-cacao mt-3 w-full text-sm font-semibold underline underline-offset-4 transition-colors"
              >
                Continua a comprare
              </button>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
