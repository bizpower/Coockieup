import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { contentRegistryEntries } from "../src/services/content.registry";

const db = new PrismaClient();

/**
 * Seed del progetto.
 *
 * Idempotente: si può rilanciare senza duplicare nulla. Popola il catalogo di
 * lancio, il copy della home, le FAQ, le pagine legali e l'utente admin.
 *
 * Tutti i dati nutrizionali, gli ingredienti e gli allergeni entrano con
 * `isConfirmed: false`. Sono valori di lavoro, il sito li mostra con il badge
 * "DA CONFERMARE" e restano tali finché qualcuno non li valida dall'admin.
 */

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "cambiami-subito";

  const admin = await db.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Redazione",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
      bio: "La squadra che scrive, impasta e risponde alle email.",
    },
  });

  console.log(`  admin: ${admin.email}`);
  return admin;
}

async function seedContent() {
  for (const entry of contentRegistryEntries()) {
    await db.siteSetting.upsert({
      where: { key: entry.key },
      update: {}, // non sovrascrive quello che la redazione ha già modificato
      create: {
        key: entry.key,
        label: entry.label,
        group: entry.group,
        valueJson: entry.default,
      },
    });
  }
  console.log(`  copy: ${contentRegistryEntries().length} blocchi`);
}

const FLAVORS = [
  {
    slug: "choco-chip",
    name: "Choco Chip",
    shapeKey: "life",
    shapeLabel: "Cuore",
    description:
      "Il classico che non tradisce: impasto d'avena e gocce di cioccolato fondente. La forma è quella del cuore che nei videogiochi ti ridà una vita.",
    colorHex: "#E23D2E",
    washHex: "#FBE3DF",
    sortOrder: 0,
  },
  {
    slug: "double-choc",
    name: "Double Choc",
    shapeKey: "energy",
    shapeLabel: "Fulmine",
    description:
      "Cacao nell'impasto e fondente dentro, per chi non considera il cioccolato un ingrediente ma una posizione politica. Forma a fulmine.",
    colorHex: "#F5C518",
    washHex: "#FDF3D4",
    sortOrder: 1,
  },
  {
    slug: "peanut-choc",
    name: "Peanut Choc",
    shapeKey: "potion",
    shapeLabel: "Ampolla",
    description:
      "Arachide e cioccolato, la coppia che non ha mai avuto bisogno di essere spiegata. Forma ad ampolla, come le pozioni che tenevi da parte e non usavi mai.",
    colorHex: "#C98A3F",
    washHex: "#F7EAD6",
    sortOrder: 2,
  },
] as const;

async function seedFlavors() {
  for (const flavor of FLAVORS) {
    await db.flavor.upsert({
      where: { slug: flavor.slug },
      update: { ...flavor },
      create: { ...flavor },
    });
  }
  console.log(`  gusti: ${FLAVORS.length}`);
}

async function seedProduct() {
  const flavors = await db.flavor.findMany();

  const product = await db.product.upsert({
    where: { slug: "the-mini-protein-cookies" },
    update: {},
    create: {
      slug: "the-mini-protein-cookies",
      name: "The Mini Protein Cookies",
      subtitle: "15 mini cookie · 3 gusti",
      description:
        "Quindici mini cookie in tre gusti, con le proteine dentro e senza il retrogusto da integratore. Cuore, fulmine e ampolla: tre forme che vengono dai power-up dei videogiochi e finiscono in una confezione richiudibile che sta ovunque.",
      status: "ACTIVE",
      unitsPerBox: 15,
      seoTitle: "Mini cookie proteici — 15 pezzi, 3 gusti",
      metaDescription:
        "15 mini cookie proteici in tre gusti: Choco Chip, Double Choc, Peanut Choc. Formato mini, gusto da biscotto vero.",
      flavors: { connect: flavors.map((f) => ({ id: f.id })) },
    },
  });

  const variants = [
    {
      sku: "BOX-01",
      name: "1 box",
      boxCount: 1,
      priceCents: 690,
      compareAtCents: null,
      stock: 240,
      isDefault: false,
      badge: null,
      sortOrder: 0,
    },
    {
      sku: "BOX-03",
      name: "3 box",
      boxCount: 3,
      priceCents: 1890,
      compareAtCents: 2070,
      stock: 120,
      isDefault: true,
      badge: "Il più scelto",
      sortOrder: 1,
    },
    {
      sku: "BOX-06",
      name: "6 box",
      boxCount: 6,
      priceCents: 3490,
      compareAtCents: 4140,
      stock: 80,
      isDefault: false,
      badge: "Miglior prezzo",
      sortOrder: 2,
    },
  ];

  for (const variant of variants) {
    await db.productVariant.upsert({
      where: { sku: variant.sku },
      update: {},
      create: { ...variant, productId: product.id },
    });
  }

  // Valori di lavoro, non validati. Il badge "DA CONFERMARE" li accompagna ovunque.
  const nutrition = [
    { key: "protein", label: "Proteine", value: "12", unit: "g", isHighlight: true, sortOrder: 0 },
    { key: "fibre", label: "Fibre", value: "6", unit: "g", isHighlight: true, sortOrder: 1 },
    { key: "energy_kcal", label: "Energia", value: "410", unit: "kcal", isHighlight: false, sortOrder: 2 },
    { key: "carbs", label: "Carboidrati", value: "48", unit: "g", isHighlight: false, sortOrder: 3 },
    { key: "sugars", label: "di cui zuccheri", value: "9", unit: "g", isHighlight: false, sortOrder: 4 },
    { key: "fat", label: "Grassi", value: "16", unit: "g", isHighlight: false, sortOrder: 5 },
    { key: "salt", label: "Sale", value: "0,4", unit: "g", isHighlight: false, sortOrder: 6 },
  ];

  for (const fact of nutrition) {
    await db.nutritionFact.upsert({
      where: { productId_key: { productId: product.id, key: fact.key } },
      update: {},
      create: { ...fact, productId: product.id, basis: "per 100 g", isConfirmed: false },
    });
  }

  const ingredients = [
    { name: "Farina d'avena", note: "La base. Da qui arrivano le fibre.", sortOrder: 0 },
    { name: "Proteine del siero del latte", note: null, sortOrder: 1 },
    { name: "Cioccolato fondente", note: "In gocce, non in copertura.", sortOrder: 2 },
    { name: "Burro di arachidi", note: "Solo nel Peanut Choc.", sortOrder: 3 },
    { name: "Cacao magro in polvere", note: "Solo nel Double Choc.", sortOrder: 4 },
    { name: "Mandorle", note: null, sortOrder: 5 },
    { name: "Uova", note: null, sortOrder: 6 },
    { name: "Agente lievitante", note: null, sortOrder: 7 },
  ];

  if ((await db.ingredient.count({ where: { productId: product.id } })) === 0) {
    await db.ingredient.createMany({
      data: ingredients.map((i) => ({ ...i, productId: product.id, isConfirmed: false })),
    });
  }

  const allergens = [
    { label: "Latte", isPresent: true, sortOrder: 0 },
    { label: "Uova", isPresent: true, sortOrder: 1 },
    { label: "Frutta a guscio", isPresent: true, sortOrder: 2 },
    { label: "Arachidi", isPresent: true, sortOrder: 3 },
    { label: "Glutine", isPresent: false, sortOrder: 4 },
    { label: "Soia", isPresent: false, sortOrder: 5 },
  ];

  if ((await db.allergen.count({ where: { productId: product.id } })) === 0) {
    await db.allergen.createMany({
      data: allergens.map((a) => ({ ...a, productId: product.id, isConfirmed: false })),
    });
  }

  // Recensioni di esempio: marcate isDemo, quindi escluse dal rating strutturato
  // e cancellabili in blocco dall'admin prima del lancio.
  const reviews = [
    {
      authorName: "Giulia M.",
      rating: 5,
      title: "Finiti in due giorni",
      body: "Li ho presi pensando fossero i soliti biscotti da armadietto e invece me li sono mangiati sul divano guardando una serie. Il fulmine è il migliore.",
    },
    {
      authorName: "Andrea T.",
      rating: 5,
      title: "Non sanno di proteico",
      body: "Il punto è questo. Li ho fatti assaggiare a mia madre senza dirle niente e me ne ha chiesto un altro.",
    },
    {
      authorName: "Sara P.",
      rating: 4,
      title: "Formato perfetto per la borsa",
      body: "Li tengo in ufficio per le quattro del pomeriggio. Unico problema: il box da uno non basta mai, ho preso quello da tre.",
    },
  ];

  if ((await db.review.count({ where: { productId: product.id } })) === 0) {
    await db.review.createMany({
      data: reviews.map((r) => ({ ...r, productId: product.id, isPublished: true, isDemo: true })),
    });
  }

  console.log(`  prodotto: ${product.name} · ${variants.length} varianti`);
  return product;
}

const FAQS = [
  {
    question: "Quanti biscotti ci sono in una confezione?",
    answer: "Quindici mini cookie, divisi fra i tre gusti.",
    group: "prodotto",
    isConfirmed: true,
    sortOrder: 0,
  },
  {
    question: "Quali sono i gusti?",
    answer:
      "Choco Chip (cuore), Double Choc (fulmine) e Peanut Choc (ampolla). Ogni box li contiene tutti e tre.",
    group: "prodotto",
    isConfirmed: true,
    sortOrder: 1,
  },
  {
    question: "Quante proteine hanno?",
    answer:
      "Il valore definitivo arriva dalle analisi di laboratorio sulla ricetta finale. Finché non lo abbiamo in mano non lo scriviamo: i numeri che vedi sul sito sono obiettivi di formulazione, segnalati come da confermare.",
    group: "prodotto",
    isConfirmed: false,
    sortOrder: 2,
  },
  {
    question: "Contengono glutine?",
    answer:
      "La formulazione è in sviluppo e non possiamo ancora dichiararlo. L'etichetta completa con allergeni e tracce sarà pubblicata prima dell'apertura degli ordini.",
    group: "prodotto",
    isConfirmed: false,
    sortOrder: 3,
  },
  {
    question: "Contengono lattosio?",
    answer:
      "Stessa risposta: dipende dalla formulazione definitiva delle proteine che useremo. Nessuna dichiarazione prima della validazione.",
    group: "prodotto",
    isConfirmed: false,
    sortOrder: 4,
  },
  {
    question: "Come vengono prodotti?",
    answer:
      "In uno stabilimento partner selezionato per la produzione di prodotti da forno. I dettagli su sede e certificazioni saranno pubblicati a contratto chiuso.",
    group: "prodotto",
    isConfirmed: false,
    sortOrder: 5,
  },
  {
    question: "Quanto durano?",
    answer:
      "La shelf life definitiva esce dai test di conservazione in corso. Sarà indicata in etichetta e qui, a test conclusi.",
    group: "prodotto",
    isConfirmed: false,
    sortOrder: 6,
  },
  {
    question: "Come vengono spediti?",
    answer:
      "Con corriere espresso in tutta Italia, in una scatola che protegge i biscotti senza usare tre strati di plastica. I tempi stimati li trovi nella pagina Spedizioni.",
    group: "spedizioni",
    isConfirmed: false,
    sortOrder: 7,
  },
];

async function seedFaqs() {
  for (const faq of FAQS) {
    const existing = await db.faqItem.findFirst({ where: { question: faq.question } });
    if (!existing) await db.faqItem.create({ data: faq });
  }
  console.log(`  faq: ${FAQS.length}`);
}

const CATEGORIES = [
  { slug: "food", name: "Food", colorHex: "#FF4B26", sortOrder: 0, description: "Ricette, abbinamenti e cose da mangiare." },
  { slug: "proteine", name: "Proteine", colorHex: "#E23D2E", sortOrder: 1, description: "Come funzionano davvero, senza slogan." },
  { slug: "benessere", name: "Benessere", colorHex: "#1F7A4D", sortOrder: 2, description: "Abitudini che reggono più di una settimana." },
  { slug: "fitness", name: "Fitness", colorHex: "#F5C518", sortOrder: 3, description: "Allenamento e alimentazione, per chi si allena e per chi no." },
  { slug: "nutrizione", name: "Nutrizione", colorHex: "#C98A3F", sortOrder: 4, description: "Etichette, macro e leggende da sfatare." },
  { slug: "lifestyle", name: "Lifestyle", colorHex: "#6B5445", sortOrder: 5, description: "Il resto della giornata." },
];

async function seedCategories() {
  for (const category of CATEGORIES) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`  categorie magazine: ${CATEGORIES.length}`);
}

const LEGAL_PAGES = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "cookie-policy", title: "Cookie Policy" },
  { slug: "termini-e-condizioni", title: "Termini e condizioni" },
  { slug: "spedizioni", title: "Spedizioni" },
  { slug: "resi-e-rimborsi", title: "Resi e rimborsi" },
];

async function seedLegalPages() {
  for (const page of LEGAL_PAGES) {
    await db.legalPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        ...page,
        needsLegalReview: true,
        bodyHtml: `<p><strong>Bozza da sottoporre a revisione legale.</strong></p><p>Questa pagina è un segnaposto strutturale. Il testo definitivo di "${page.title}" deve essere redatto o validato da un consulente legale prima dell'apertura degli ordini, sulla base della ragione sociale, della sede e dei fornitori effettivamente utilizzati.</p><p>Il contenuto è modificabile da <code>/admin/settings</code>.</p>`,
      },
    });
  }
  console.log(`  pagine legali: ${LEGAL_PAGES.length} (tutte in revisione)`);
}

async function seedShipping() {
  const existing = await db.shippingRate.findFirst();
  if (existing) return;

  await db.shippingRate.create({
    data: {
      name: "Corriere espresso",
      description: "Consegna in tutta Italia.",
      priceCents: 490,
      freeOverCents: 3900,
      estimateDays: "2-4 giorni lavorativi",
      sortOrder: 0,
    },
  });
  console.log("  spedizione: corriere espresso");
}

async function main() {
  console.log("Seed in corso…");
  await seedAdmin();
  await seedContent();
  await seedFlavors();
  await seedProduct();
  await seedFaqs();
  await seedCategories();
  await seedLegalPages();
  await seedShipping();
  console.log("Fatto.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
