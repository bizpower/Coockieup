import { Bricolage_Grotesque, Inter } from "next/font/google";

/**
 * Due caratteri, due ruoli.
 *
 * Display — grotesque contemporanea, larga, con dettagli che non sembrano
 * "font di default". È la voce del brand: titoli stretti, tracking negativo.
 * Testo — sans neutra, ottimizzata per la leggibilità a 15-16px su mobile.
 *
 * Entrambi self-hosted da Next in fase di build: nessuna richiesta a Google
 * in runtime, quindi nessun blocco del rendering e nessun cookie di terze parti.
 */

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-family",
  weight: ["600", "700", "800"],
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-family",
});

export const fontVariables = `${display.variable} ${sans.variable}`;
