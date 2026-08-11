/**
 * MANIFESTO DELLE IMMAGINI
 *
 * Il sito oggi disegna prodotto e packaging con componenti vettoriali
 * (src/components/brand/): non ci sono riquadri grigi da nascondere, e il
 * disegno cambia insieme a BRAND_NAME invece di diventare un file da rifare.
 *
 * Quando arrivano le fotografie vere, questo file è l'unico posto da toccare.
 * Ogni voce dichiara dove va il file, che proporzioni deve avere e che testo
 * alternativo porta con sé. Metti il file nel percorso indicato, porta `source`
 * a "photo" e il sito passa alla foto.
 *
 * Le specifiche di scatto (inquadrature, luce, styling) sono in docs/PHOTO-BRIEF.md.
 */

export type ImageSlot = {
  /** Percorso sotto /public. Il file va messo esattamente qui. */
  path: string;
  /** Testo alternativo. Obbligatorio: nessuna immagine entra nel sito senza. */
  alt: string;
  /** Proporzioni attese: serve a evitare il salto di layout al caricamento. */
  ratio: `${number}:${number}`;
  /** "vector" = oggi lo disegna un componente. "photo" = usa il file. */
  source: "vector" | "photo";
  /** Dove compare, per capire cosa si rompe se manca. */
  usedIn: string;
};

export const IMAGES = {
  productHero: {
    path: "/images/product/hero-pack.jpg",
    alt: "Confezione di mini cookie proteici su fondo crema, luce da studio",
    ratio: "19:26",
    source: "vector",
    usedIn: "Hero homepage, pagina prodotto",
  },
  packFront: {
    path: "/images/packaging/pack-front.jpg",
    alt: "Fronte della confezione con i tre gusti",
    ratio: "19:26",
    source: "vector",
    usedIn: "Card bundle, shop",
  },
  packOpen: {
    path: "/images/packaging/pack-open.jpg",
    alt: "Confezione aperta con i mini cookie che escono",
    ratio: "4:3",
    source: "vector",
    usedIn: "Pagina prodotto, galleria",
  },
  macroChocoChip: {
    path: "/images/product/macro-choco-chip.jpg",
    alt: "Primo piano del mini cookie Choco Chip a forma di cuore",
    ratio: "1:1",
    source: "vector",
    usedIn: "Sezione gusti, pagina prodotto",
  },
  macroDoubleChoc: {
    path: "/images/product/macro-double-choc.jpg",
    alt: "Primo piano del mini cookie Double Choc a forma di fulmine",
    ratio: "1:1",
    source: "vector",
    usedIn: "Sezione gusti, pagina prodotto",
  },
  macroPeanutChoc: {
    path: "/images/product/macro-peanut-choc.jpg",
    alt: "Primo piano del mini cookie Peanut Choc a forma di ampolla",
    ratio: "1:1",
    source: "vector",
    usedIn: "Sezione gusti, pagina prodotto",
  },
  lifestyleDesk: {
    path: "/images/lifestyle/scrivania.jpg",
    alt: "La confezione aperta accanto a un computer portatile su una scrivania",
    ratio: "3:2",
    source: "vector",
    usedIn: "Pagina Il nostro biscotto",
  },
  lifestyleBag: {
    path: "/images/lifestyle/zaino.jpg",
    alt: "La confezione che spunta dalla tasca di uno zaino",
    ratio: "3:2",
    source: "vector",
    usedIn: "Pagina Il nostro biscotto",
  },
  lifestyleCoffee: {
    path: "/images/lifestyle/pausa-caffe.jpg",
    alt: "Mini cookie accanto a una tazzina di caffè su un tavolino da bar",
    ratio: "3:2",
    source: "vector",
    usedIn: "Magazine, social",
  },
  socialVertical: {
    path: "/images/social/vertical-1.jpg",
    alt: "Scatto verticale della confezione per Instagram e TikTok",
    ratio: "9:16",
    source: "vector",
    usedIn: "Open Graph, contenuti social",
  },
  ogDefault: {
    path: "/images/social/og-default.jpg",
    alt: "Immagine di anteprima per la condivisione sui social",
    ratio: "1200:630",
    source: "vector",
    usedIn: "Open Graph e Twitter card di default",
  },
} as const satisfies Record<string, ImageSlot>;

export type ImageKey = keyof typeof IMAGES;

/** Le voci ancora servite dal vettore: la lista di cosa manca prima del lancio. */
export function pendingPhotos() {
  return (Object.keys(IMAGES) as ImageKey[]).filter((key) => IMAGES[key].source === "vector");
}
