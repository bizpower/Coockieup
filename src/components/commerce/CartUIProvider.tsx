"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Stato di apertura del carrello laterale.
 *
 * Il contesto porta solo `open`: il *contenuto* del carrello arriva dal server
 * come props, e dopo ogni azione la revalidazione lo aggiorna da sola. Tenere
 * una copia del carrello nello stato del client significherebbe avere due
 * verità e, prima o poi, un totale diverso da quello che si paga.
 */

type CartUIValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartUIContext = createContext<CartUIValue | null>(null);

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<CartUIValue>(
    () => ({
      open,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
    }),
    [open],
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI(): CartUIValue {
  const context = useContext(CartUIContext);
  if (!context) throw new Error("useCartUI va usato dentro <CartUIProvider>.");
  return context;
}

/** Apre il carrello e basta: comodo per i bottoni che non hanno altro da fare. */
export function useOpenCart() {
  const { openCart } = useCartUI();
  return useCallback(() => openCart(), [openCart]);
}
