/**
 * IDENTITÀ DEL BRAND — punto di modifica unico.
 *
 * Cambia `BRAND_NAME` qui sotto e l'intero progetto si aggiorna: logo, navbar,
 * footer, confezione disegnata, immagine di anteprima, metadata, structured
 * data, email e numerazione ordini. Nessun altro file contiene il nome.
 *
 * Il nome scelto è CookieUp: dice il prodotto e insieme il power-up dei
 * videogiochi. Il logotipo lo sfrutta — vedi src/components/brand/wordmark.ts,
 * dove la seconda metà del nome prende il colore e sale di un soffio.
 */
export const BRAND_NAME = "CookieUp";

/** Prefisso dei numeri d'ordine, es. CU-2026-0001. Max 3 lettere. */
export const BRAND_ORDER_PREFIX = "CU";

/** Payoff breve. Compare sotto il logo e nei metadata. */
export const BRAND_TAGLINE = "The Mini Protein Cookies";

/** Come si legge il brand ad alta voce (usato in `speakable` e nei prompt vocali). */
export const BRAND_PHONETIC = "cùchi-àp";

export const BRAND_LEGAL = {
  /** Ragione sociale — DA CONFERMARE prima del lancio. */
  companyName: "[RAGIONE SOCIALE]",
  vatId: "[PARTITA IVA]",
  address: "[INDIRIZZO SEDE LEGALE]",
  email: "ciao@example.com",
  supportEmail: "ordini@example.com",
} as const;

export const BRAND_SOCIAL = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  pinterest: "https://pinterest.com/",
} as const;

/**
 * Solo i profili che esistono davvero.
 *
 * Finché un indirizzo è la home della piattaforma — `https://instagram.com/`,
 * senza nome utente — non è il profilo di nessuno. Dichiararlo a Google come
 * `sameAs` del brand significa affermare una cosa falsa su un'entità: nel
 * migliore dei casi viene ignorato, nel peggiore confonde l'identità del
 * brand con quella della piattaforma.
 *
 * Il riconoscimento è sul percorso vuoto, non su una lista di indirizzi da
 * tenere aggiornata a ogni piattaforma che si aggiunge.
 */
export function profiliSocialReali(): string[] {
  return Object.values(BRAND_SOCIAL).filter((indirizzo) => {
    try {
      return new URL(indirizzo).pathname.replace(/\/+$/, "") !== "";
    } catch {
      return false;
    }
  });
}

/**
 * Le tre forme "power-up". Sono la firma visiva del brand: compaiono come biscotti,
 * come bullet, come divisori e nei pattern di sfondo.
 *
 * `key` è la chiave usata dal database (`Flavor.shapeKey`) e dal componente
 * <CookieShape />. Aggiungere una quarta forma significa: aggiungere una voce qui
 * e il path SVG corrispondente in src/components/brand/CookieShape.tsx.
 */
export const COOKIE_SHAPES = ["life", "energy", "potion"] as const;
export type CookieShapeKey = (typeof COOKIE_SHAPES)[number];

export const SHAPE_LABELS: Record<CookieShapeKey, string> = {
  life: "Cuore",
  energy: "Fulmine",
  potion: "Ampolla",
};
