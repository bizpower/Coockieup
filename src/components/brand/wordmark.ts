import { BRAND_NAME } from "@/config/brand";

/**
 * Come si scompone il marchio.
 *
 * Il logotipo compare in tre posti diversi — la navbar in HTML, la confezione
 * in SVG, l'immagine di anteprima generata da satori — e nessuno dei tre può
 * riusare il codice degli altri. Quello che possono condividere è la regola:
 * dove si spezza il nome e quale metà porta il colore.
 *
 * La regola legge il nome invece di essere scritta su misura per questo:
 *
 * - un nome in camelCase la accentazione ce l'ha già dentro. `CookieUp` si
 *   spezza da solo in `Cookie` + `Up`, e la seconda metà prende il fiamma. Nel
 *   caso di CookieUp la seconda metà è anche il senso del nome: il power-up.
 * - un nome tutto attaccato non ha quel punto di rottura, e allora il segno
 *   torna a essere il punto in fiamma dopo il nome.
 *
 * Così `BRAND_NAME` resta l'unico posto da toccare per cambiare marchio, anche
 * se il nome che arriva ha una forma diversa da quello di oggi.
 */

export type Wordmark = {
  /** La parte in colore pieno. */
  lead: string;
  /** La parte in fiamma: la seconda metà del nome, oppure il punto. */
  accent: string;
  /** `camel` alza l'accento sulla linea di base e non forza il maiuscolo. */
  kind: "camel" | "dot";
};

const CAMEL_BOUNDARY = /^(.*[a-z])([A-Z].*)$/;

export function wordmark(name: string = BRAND_NAME): Wordmark {
  const parts = CAMEL_BOUNDARY.exec(name);
  const lead = parts?.[1];
  const accent = parts?.[2];
  if (lead && accent) return { lead, accent, kind: "camel" };
  return { lead: name, accent: ".", kind: "dot" };
}
