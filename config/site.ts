import { BRAND_NAME, BRAND_TAGLINE } from "./brand";

/**
 * Configurazione del sito: URL canonico, lingua, valuta, navigazione.
 * Il copy modificabile dalla redazione vive invece nel database (SiteSetting),
 * non qui: questo file contiene solo ciò che è strutturale.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_LOCALE = "it_IT";
export const SITE_LANG = "it";

export const CURRENCY = {
  code: "EUR",
  symbol: "€",
  locale: "it-IT",
} as const;

export const SITE_NAME = BRAND_NAME;
export const SITE_TITLE_TEMPLATE = `%s · ${BRAND_NAME}`;
export const SITE_DEFAULT_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

export const MAIN_NAV = [
  // Il logo riporta alla home, ma è una convenzione che non tutti danno per
  // scontata su un sito che vedono per la prima volta. La voce esplicita
  // costa uno spazio e toglie un dubbio.
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Il nostro biscotto", href: "/il-nostro-biscotto" },
  { label: "Ingredienti", href: "/ingredienti" },
  { label: "Magazine", href: "/magazine" },
  { label: "FAQ", href: "/faq" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Prodotto",
    links: [
      { label: "Shop", href: "/shop" },
      { label: "Il nostro biscotto", href: "/il-nostro-biscotto" },
      { label: "Ingredienti", href: "/ingredienti" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Magazine",
    links: [
      { label: "Tutti gli articoli", href: "/magazine" },
      { label: "Food", href: "/magazine/categoria/food" },
      { label: "Proteine", href: "/magazine/categoria/proteine" },
      { label: "Benessere", href: "/magazine/categoria/benessere" },
    ],
  },
  {
    title: "Assistenza",
    links: [
      { label: "Contatti", href: "/contatti" },
      { label: "I miei ordini", href: "/account" },
      { label: "Spedizioni", href: "/legal/spedizioni" },
      { label: "Resi e rimborsi", href: "/legal/resi-e-rimborsi" },
    ],
  },
  {
    title: "Legale",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Cookie Policy", href: "/legal/cookie-policy" },
      { label: "Termini e condizioni", href: "/legal/termini-e-condizioni" },
    ],
  },
] as const;
