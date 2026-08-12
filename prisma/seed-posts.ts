import type { PrismaClient } from "@prisma/client";

/**
 * Articoli di partenza per il magazine.
 *
 * Sono contenuti veri, non riempitivo: un magazine che nasce vuoto non si
 * capisce, e tre articoli scritti mostrano il tono di voce a chi dovrà
 * continuare a scriverli.
 *
 * Ogni blocco viene convertito insieme in JSON per l'editor e in HTML per il
 * rendering, dalla stessa fonte: così i due non possono divergere.
 */

type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { quote: string };

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  /** Giorni indietro rispetto a oggi, per non avere tre articoli con la stessa data. */
  daysAgo: number;
  body: Block[];
};

/** Grassetto con **doppio asterisco** e link [testo](/percorso). */
function inlineToJson(text: string) {
  const nodes: Record<string, unknown>[] = [];
  const pattern = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push({ type: "text", text: text.slice(cursor, index) });

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push({
        type: "text",
        text: token.slice(2, -2),
        marks: [{ type: "bold" }],
      });
    } else {
      const [, label, href] = token.match(/\[([^\]]+)\]\(([^)]+)\)/) ?? [];
      nodes.push({
        type: "text",
        text: label ?? "",
        marks: [{ type: "link", attrs: { href: href ?? "#" } }],
      });
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push({ type: "text", text: text.slice(cursor) });
  return nodes;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function buildContent(body: Block[]) {
  const json: Record<string, unknown>[] = [];
  const html: string[] = [];

  for (const block of body) {
    if ("h2" in block) {
      json.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: block.h2 }],
      });
      html.push(`<h2>${escapeHtml(block.h2)}</h2>`);
    } else if ("p" in block) {
      json.push({ type: "paragraph", content: inlineToJson(block.p) });
      html.push(`<p>${inlineToHtml(block.p)}</p>`);
    } else if ("ul" in block) {
      json.push({
        type: "bulletList",
        content: block.ul.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: inlineToJson(item) }],
        })),
      });
      html.push(`<ul>${block.ul.map((item) => `<li>${inlineToHtml(item)}</li>`).join("")}</ul>`);
    } else {
      json.push({
        type: "blockquote",
        content: [{ type: "paragraph", content: inlineToJson(block.quote) }],
      });
      html.push(`<blockquote><p>${inlineToHtml(block.quote)}</p></blockquote>`);
    }
  }

  return { json: { type: "doc", content: json }, html: html.join("") };
}

function countWords(body: Block[]): number {
  const text = body
    .map((block) =>
      "h2" in block
        ? block.h2
        : "p" in block
          ? block.p
          : "ul" in block
            ? block.ul.join(" ")
            : block.quote,
    )
    .join(" ")
    .replace(/[*[\]()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text ? text.split(" ").length : 0;
}

const POSTS: SeedPost[] = [
  {
    slug: "quante-proteine-servono-davvero-in-uno-snack",
    title: "Quante proteine servono davvero in uno snack",
    excerpt:
      "Venti grammi a merenda non sono un obiettivo, sono un numero copiato dal marketing. Come leggere l'etichetta di uno snack proteico senza farsi impressionare dai numeri grandi.",
    categorySlug: "proteine",
    focusKeyword: "snack proteico",
    seoTitle: "Quante proteine servono in uno snack proteico",
    metaDescription:
      "Come capire se uno snack proteico ha senso: cosa guardare in etichetta, perché il numero grande non basta e quanto conta il resto della giornata.",
    tags: ["proteine", "etichette", "spuntini"],
    daysAgo: 3,
    body: [
      {
        p: "Sugli scaffali degli snack proteici c'è una gara silenziosa a chi stampa il numero più grande sul fronte della confezione. Venti grammi. Venticinque. Trenta. Il problema è che quel numero, da solo, non dice quasi niente su quanto quel prodotto sia utile a te.",
      },
      { h2: "Il fabbisogno non si misura a spuntino" },
      {
        p: "Le proteine si contano sulla giornata, non sul singolo momento. Le linee guida internazionali per una persona adulta sedentaria partono da circa **0,8 grammi per chilo di peso corporeo al giorno**, e salgono per chi si allena con regolarità. Su una persona di 70 chili si parla di 56 grammi al giorno come base.",
      },
      {
        p: "Distribuiti su tre pasti e un paio di spuntini, significa che un merenda che ne porta 6-8 sta già facendo la sua parte. Uno snack da trenta grammi di proteine non è più virtuoso: è semplicemente un pasto travestito da merenda.",
      },
      { h2: "Cosa guardare davvero in etichetta" },
      {
        ul: [
          "**I valori per porzione, non per 100 g.** Un biscotto da 10 grammi e una barretta da 60 non si confrontano sulla stessa colonna.",
          "**Da dove arrivano le proteine.** Siero del latte, uova, legumi e collagene non sono intercambiabili: il collagene, in particolare, ha un profilo amminoacidico incompleto.",
          "**Il resto degli ingredienti.** Se dopo le proteine la lista è un elenco di sciroppi, polioli e aromi, il prodotto è un dolce con una dichiarazione in più.",
          "**Le fibre.** Sono la voce che più spesso manca, ed è quella che fa la differenza sulla sazietà reale.",
        ],
      },
      { h2: "Il test che conta" },
      {
        quote:
          "Se non lo rimangeresti sapendo che non è proteico, allora non è buono: è solo funzionale.",
      },
      {
        p: "È il criterio che usiamo anche noi in laboratorio. Un prodotto che si mangia solo perché fa parte di un programma dura finché dura la motivazione. Uno che si mangia perché è buono resta nel cassetto della scrivania molto più a lungo.",
      },
      {
        p: "I nostri valori definitivi arriveranno dalle analisi sulla ricetta finale, e li pubblicheremo quando li avremo in mano. Nel frattempo, quello che trovi sul sito è segnalato come obiettivo di formulazione — perché è esattamente quello che è.",
      },
    ],
  },
  {
    slug: "perche-il-formato-mini-funziona",
    title: "Perché il formato mini funziona (e non è una questione di calorie)",
    excerpt:
      "Il vantaggio dei biscotti piccoli non è mangiarne meno. È poter decidere quando smettere, invece di scoprire di aver finito la confezione.",
    categorySlug: "lifestyle",
    focusKeyword: "formato mini",
    seoTitle: "Perché il formato mini funziona davvero",
    metaDescription:
      "Il formato mini non serve a mangiare meno: serve a decidere quanto. Cosa dice la ricerca sulle unità di consumo e sulla percezione della porzione.",
    tags: ["abitudini", "porzioni", "snack"],
    daysAgo: 9,
    body: [
      {
        p: "C'è un motivo per cui una tavoletta di cioccolato divisa in quadretti si mangia diversamente da una barra intera, anche a parità di grammi. Non è forza di volontà: è che il quadretto è un punto in cui fermarsi, e la barra no.",
      },
      { h2: "L'unità di consumo" },
      {
        p: "In psicologia alimentare si chiama **unit bias**: tendiamo a considerare \"una porzione\" l'unità che ci viene servita, qualunque sia la sua dimensione. Un biscotto grande e uno piccolo vengono percepiti come la stessa cosa — uno.",
      },
      {
        p: "Il che ha un risvolto pratico interessante: con un formato piccolo, ogni pezzo è anche una decisione. Ne prendi un altro perché lo vuoi, non perché eri già a metà.",
      },
      { h2: "Non è una dieta travestita" },
      {
        p: "Va detto chiaramente: nessuno dimagrisce perché i biscotti sono piccoli. Se ne mangi dodici, hai mangiato dodici biscotti. Il formato mini non è un trucco metabolico, è un'interfaccia migliore.",
      },
      {
        ul: [
          "Puoi mangiarne uno senza aprire un pacchetto da 200 grammi.",
          "Puoi portarne tre in borsa senza che si sbriciolino sul fondo.",
          "Puoi finire lo spuntino in un minuto invece che in cinque.",
          "Puoi condividerli senza dover spezzare qualcosa a metà.",
        ],
      },
      { h2: "Il formato giusto per il momento giusto" },
      {
        p: "Le quattro del pomeriggio non sono un pasto. Sono un buco di venti minuti fra due cose da fare, e quello che ci sta dentro deve essere proporzionato al buco. Un biscotto da otto grammi ci sta. Una barretta da sessanta, spesso, è più di quello che serviva.",
      },
      {
        p: "È da qui che è partito il nostro progetto: non da \"come faccio uno snack proteico\", ma da \"cosa mangerei volentieri alle quattro senza pensarci troppo\". Il resto — le proteine, le fibre, [la ricetta](/ingredienti) — è venuto dopo.",
      },
    ],
  },
  {
    slug: "come-si-legge-un-elenco-ingredienti",
    title: "Come si legge un elenco ingredienti in trenta secondi",
    excerpt:
      "Non serve una laurea in scienze alimentari. Servono tre regole, e la disponibilità a girare la confezione invece di fermarsi al fronte.",
    categorySlug: "nutrizione",
    focusKeyword: "elenco ingredienti",
    seoTitle: "Come leggere un elenco ingredienti in 30 secondi",
    metaDescription:
      "Tre regole per capire un elenco ingredienti al volo: l'ordine di peso, i nomi degli zuccheri e cosa significa davvero una lista corta.",
    tags: ["etichette", "nutrizione", "spesa"],
    daysAgo: 16,
    body: [
      {
        p: "Il fronte di una confezione è pubblicità. Il retro è informazione. La differenza fra i due lati è tutta lì, e girare il pacchetto costa due secondi.",
      },
      { h2: "Regola 1: l'ordine è il peso" },
      {
        p: "Gli ingredienti sono elencati in ordine decrescente di quantità. È una regola di legge, non una convenzione. Quindi il primo ingrediente è quello di cui il prodotto è fatto per la maggior parte, e se al primo posto trovi lo zucchero, hai finito di leggere.",
      },
      {
        p: "Attenzione all'inverso, però: un ingrediente in fondo alla lista non è necessariamente irrilevante. Il sale, per esempio, sta sempre in fondo e conta parecchio.",
      },
      { h2: "Regola 2: lo zucchero ha molti nomi" },
      {
        p: "Uno dei modi più semplici per far scendere lo zucchero nell'elenco è spezzarlo in più fonti diverse, ognuna delle quali pesa meno. Sciroppo di glucosio, destrosio, maltodestrine, succo d'uva concentrato, sciroppo d'agave: contati separatamente stanno tutti a metà lista.",
      },
      {
        ul: [
          "Cerca le parole che finiscono in **-osio**: sono zuccheri.",
          "**Sciroppo** di qualunque cosa è zucchero, anche quando è biologico.",
          "**Succo concentrato** di frutta, nella pratica, è zucchero.",
          "I **polioli** (maltitolo, xilitolo, eritritolo) non sono zuccheri, ma oltre una certa quantità hanno effetti che scoprirai da solo.",
        ],
      },
      { h2: "Regola 3: corta non vuol dire buona" },
      {
        p: "La lista corta è diventata un argomento di vendita, e come tutti gli argomenti di vendita va preso con cautela. Cinque ingredienti di cui tre sono zucchero non sono meglio di dieci ingredienti riconoscibili.",
      },
      {
        quote:
          "La domanda giusta non è quanti ingredienti ci sono, ma se li riconosceresti aprendo la tua dispensa.",
      },
      {
        p: "È il criterio con cui stiamo costruendo la nostra ricetta: avena, proteine, cioccolato fondente, frutta secca. Quando sarà chiusa la pubblicheremo per intero — e fino ad allora quello che trovi sul sito è dichiarato per quello che è, cioè una direzione di lavoro.",
      },
    ],
  },
];

export async function seedPosts(db: PrismaClient) {
  const author = await db.adminUser.findFirst({ orderBy: { createdAt: "asc" } });

  for (const post of POSTS) {
    const existing = await db.post.findUnique({ where: { slug: post.slug } });
    if (existing) continue;

    const category = await db.category.findUnique({ where: { slug: post.categorySlug } });
    const { json, html } = buildContent(post.body);
    const wordCount = countWords(post.body);

    const tagConnections = [];
    for (const name of post.tags) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const tag = await db.tag.upsert({
        where: { slug },
        update: {},
        create: { slug, name },
      });
      tagConnections.push({ id: tag.id });
    }

    await db.post.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000),
        // Prisma tipizza le colonne Json in modo stretto: il documento è già
        // nella forma attesa da TipTap, qui serve solo dirlo al compilatore.
        contentJson: json as object,
        contentHtml: html,
        categoryId: category?.id ?? null,
        authorId: author?.id ?? null,
        focusKeyword: post.focusKeyword,
        seoTitle: post.seoTitle,
        metaDescription: post.metaDescription,
        wordCount,
        readingMinutes: Math.max(1, Math.round(wordCount / 200)),
        tags: { connect: tagConnections },
      },
    });
  }

  console.log(`  articoli: ${POSTS.length}`);
}
