import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * robots.txt.
 *
 * Finché `NEXT_PUBLIC_ALLOW_INDEXING` non vale "true" il sito è chiuso a tutti
 * i crawler. È voluto: un'anteprima indicizzata prima del lancio resta nei
 * risultati per settimane, e nel frattempo mostra prezzi, date e claim che
 * non sono ancora definitivi.
 *
 * ## I crawler dei motori generativi
 *
 * Sono un caso a parte, e vanno nominati invece che lasciati alla regola
 * generica. Chi cerca "biscotti proteici italiani" sempre più spesso non
 * guarda dieci risultati: legge una risposta scritta da un modello, che cita
 * due o tre fonti. Restare fuori da quelle fonti significa non esistere in
 * quel canale, anche stando primi su Google.
 *
 * La distinzione che conta è fra due mestieri diversi che questi bot fanno:
 *
 * - **leggere per rispondere adesso** (OAI-SearchBot, PerplexityBot,
 *   ChatGPT-User, Claude-SearchBot): stanno costruendo una risposta per una
 *   persona che ha appena fatto una domanda, e citano la fonte. È traffico e
 *   visibilità, esattamente come un motore di ricerca.
 * - **raccogliere per addestrare** (GPTBot, ClaudeBot, Google-Extended,
 *   CCBot, Bytespider): il contenuto finisce in un modello, senza link di
 *   ritorno e senza controllo su quando e come verrà ripetuto.
 *
 * Qui i primi sono ammessi e i secondi si governano con
 * `ALLOW_AI_TRAINING`. Il valore predefinito è **no**: per un brand alimentare
 * con dati di etichetta non ancora validati, finire dentro un modello che li
 * ripeterà per anni è un rischio asimmetrico — il sito si corregge in un
 * minuto, un modello addestrato no.
 */

/** Leggono per rispondere a una domanda, e citano la fonte. */
const RISPONDONO = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Applebot",
  "Applebot-Extended",
  "meta-externalfetcher",
];

/** Raccolgono per addestrare: nessun link di ritorno, nessun controllo dopo. */
const ADDESTRANO = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "Omgilibot",
  "Diffbot",
];

/** Percorsi senza valore per un crawler, o con contenuto personale. */
const VIETATI = [
  "/admin",
  "/api",
  "/cart",
  "/checkout",
  "/account",
  "/order-confirmation",
  "/setup",
];

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

  if (!allowIndexing) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  const consentiAddestramento = process.env.ALLOW_AI_TRAINING === "true";

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: VIETATI },
      ...RISPONDONO.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: VIETATI,
      })),
      ...ADDESTRANO.map((bot) =>
        consentiAddestramento
          ? { userAgent: bot, allow: "/", disallow: VIETATI }
          : { userAgent: bot, disallow: "/" },
      ),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
