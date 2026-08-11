/**
 * IDENTITÀ DEL BRAND — punto di modifica unico.
 *
 * Il nome definitivo non è ancora stato scelto. Cambia `BRAND_NAME` qui sotto e
 * l'intero progetto si aggiorna: logo, navbar, footer, metadata, structured data,
 * email, numerazione ordini e copy. Nessun altro file contiene il nome del brand.
 *
 * Direzioni valutate: SGRANÀ · MORDÌ · CROCCÒ · SGRANÌ · BISCÙ · BOCCÒ
 */
export const BRAND_NAME = "SGRANÀ";

/** Prefisso dei numeri d'ordine, es. SG-2026-0001. Max 3 lettere. */
export const BRAND_ORDER_PREFIX = "SG";

/** Payoff breve. Compare sotto il logo e nei metadata. */
export const BRAND_TAGLINE = "The Mini Protein Cookies";

/** Come si legge il brand ad alta voce (usato in `speakable` e nei prompt vocali). */
export const BRAND_PHONETIC = "sgra-NÀ";

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
