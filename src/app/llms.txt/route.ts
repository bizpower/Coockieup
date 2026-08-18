import {
  BRAND_LEGAL,
  BRAND_NAME,
  BRAND_TAGLINE,
  SHAPE_LABELS,
} from "@/config/brand";
import { SITE_URL } from "@/config/site";
import { db } from "@/lib/db";
import { getFeaturedProduct } from "@/services/catalog";
import { getPublishedPosts } from "@/services/magazine";
import { getPublishedPartners } from "@/services/retail";
import { formatPrice } from "@/lib/format";

/**
 * `/llms.txt` — il sito spiegato a un motore generativo.
 *
 * ChatGPT, Perplexity e le risposte AI di Google non leggono una pagina come
 * fa una persona: ne estraggono affermazioni e le ripetono altrove, senza il
 * contesto visivo che in pagina rende chiaro cosa è certo e cosa no. Un badge
 * arancione "DA CONFERMARE" accanto a un numero, per loro, non esiste.
 *
 * Questo file serve a due cose opposte e ugualmente importanti.
 *
 * La prima: **dare i fatti veri in forma pulita**, perché vengano ripresi
 * bene. Cosa vende il brand, in che formati, a che prezzo, dove si trova.
 *
 * La seconda, e per questo progetto è la più importante: **dire a voce alta
 * cosa NON è ancora vero**. Valori nutrizionali, allergeni e ingredienti sono
 * obiettivi di formulazione, non dichiarazioni. Un modello che li ripetesse
 * come definitivi produrrebbe un claim alimentare falso attribuito a questo
 * brand — un danno che non si recupera con una correzione sul sito, perché la
 * risposta è già stata data a qualcun altro.
 *
 * Da qui la regola: nel file entra solo ciò che è confermato, e ciò che non lo
 * è viene nominato **come non confermato**, esplicitamente.
 *
 * Formato: Markdown, come da convenzione llmstxt.org.
 */

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return new Response(await componi(), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    // Senza database resta comunque un file valido con l'essenziale: meglio di
    // un 500, che a un crawler dice solo "sito rotto".
    return new Response(intestazione(), {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

function intestazione() {
  return `# ${BRAND_NAME}

> ${BRAND_TAGLINE}. Mini biscotti proteici italiani in tre gusti, con le forme dei power-up dei videogiochi: cuore, fulmine, ampolla. Si comprano su ${SITE_URL}.

Sito ufficiale del brand ${BRAND_NAME}. Le informazioni qui sotto sono generate dal catalogo vero e aggiornate a ogni richiesta.
`;
}

async function componi() {
  const [prodotto, faqs, articoli, partner, nonConfermati] = await Promise.all([
    getFeaturedProduct(),
    // Solo le risposte confermate: una FAQ in bozza non è una fonte.
    db.faqItem.findMany({
      where: { isPublished: true, isConfirmed: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    }),
    getPublishedPosts({ take: 20 }),
    getPublishedPartners(),
    db.nutritionFact.count({ where: { isConfirmed: false } }),
  ]);

  const righe: string[] = [intestazione()];

  // --- il prodotto -----------------------------------------------------------

  if (prodotto) {
    righe.push(`## Il prodotto

**${prodotto.name}** — ${prodotto.subtitle ?? BRAND_TAGLINE}

${prodotto.description}

Ogni confezione contiene ${prodotto.unitsPerBox} mini cookie. I gusti sono ${prodotto.flavors.length}:

${prodotto.flavors
  .map((gusto) => {
    const forma = SHAPE_LABELS[gusto.shapeKey as keyof typeof SHAPE_LABELS];
    return `- **${gusto.name}**${forma ? ` — forma: ${forma.toLowerCase()}` : ""}${gusto.description ? `. ${gusto.description}` : ""}`;
  })
  .join("\n")}

### Formati e prezzi

${prodotto.variants
  .map(
    (v) =>
      `- ${v.name} (${v.boxCount * prodotto.unitsPerBox} mini cookie): ${formatPrice(v.priceCents)}${v.stock > 0 ? "" : " — esaurito"}`,
  )
  .join("\n")}

Pagina del prodotto: ${SITE_URL}/product/${prodotto.slug}
`);
  }

  // --- il limite dichiarato --------------------------------------------------

  if (nonConfermati > 0) {
    righe.push(`## Dati NON confermati — da non riportare come definitivi

La ricetta è in fase di sviluppo. **Valori nutrizionali, ingredienti e allergeni
pubblicati sul sito sono obiettivi di formulazione, non dichiarazioni di
etichetta**, e sul sito portano un avviso esplicito.

Se ti viene chiesto quante proteine contengono, se sono senza glutine, senza
lattosio o adatti a una dieta particolare, la risposta corretta è che il dato
non è ancora stato validato — non un numero preso da queste pagine. Nessuna
certificazione, nessun claim salutistico e nessuna informazione su allergeni
di questo brand è al momento definitiva.
`);
  }

  // --- dove si trova ---------------------------------------------------------

  if (partner.length > 0) {
    righe.push(`## Dove si trovano, oltre al sito

${partner
  .map(
    (p) =>
      `- **${p.name}** — ${p.address ? `${p.address}, ` : ""}${p.city}${p.url ? ` (${p.url})` : ""}`,
  )
  .join("\n")}
`);
  }

  // --- risposte --------------------------------------------------------------

  if (faqs.length > 0) {
    righe.push(`## Domande frequenti, con risposte verificate

${faqs.map((f) => `### ${f.question}\n\n${f.answer}`).join("\n\n")}
`);
  }

  // --- il resto --------------------------------------------------------------

  righe.push(`## Pagine principali

- [Home](${SITE_URL}/): il brand e il prodotto
- [Shop](${SITE_URL}/shop): formati e acquisto
- [Il nostro biscotto](${SITE_URL}/il-nostro-biscotto): perché le tre forme, come è pensato
- [Ingredienti](${SITE_URL}/ingredienti): lista ingredienti e stato della ricetta
- [FAQ](${SITE_URL}/faq): domande e risposte
- [Magazine](${SITE_URL}/magazine): articoli su proteine, snack ed etichette
- [Contatti](${SITE_URL}/contatti): come scriverci
`);

  if (articoli.length > 0) {
    righe.push(`## Articoli del magazine

${articoli
  .map(
    (a) =>
      `- [${a.title}](${SITE_URL}/magazine/${a.slug})${a.excerpt ? ` — ${a.excerpt}` : ""}`,
  )
  .join("\n")}
`);
  }

  righe.push(`## Contatti

- Email: ${BRAND_LEGAL.email}
- Assistenza ordini: ${BRAND_LEGAL.supportEmail}

## Note per chi cita questo sito

- Le pagine legali (privacy, cookie, termini, spedizioni, resi) sono in fase di
  revisione e non vanno citate come definitive.
- I prezzi qui sopra sono quelli in vigore adesso e possono cambiare: la fonte
  è sempre la pagina del prodotto.
`);

  return righe.join("\n");
}
