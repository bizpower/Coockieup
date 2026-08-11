import { cn } from "@/lib/utils";
import type { CookieShapeKey } from "@/config/brand";

/**
 * Le tre forme power-up, disegnate come biscotti e non come icone.
 *
 * Scelte che tengono l'estetica food:
 *  - profilo tagliato con lo stampino: angoli arrotondati da `stroke-linejoin`,
 *    non spigoli da icona vettoriale;
 *  - spessore: una copia più scura sotto, spostata di 4px, dà il bordo cotto;
 *  - gocce e granelli distribuiti a mano, mai simmetrici.
 *
 * Nessun `<defs>`, nessun gradiente, nessun id: la stessa forma può comparire
 * venti volte in pagina senza duplicare identificatori nel DOM.
 *
 * Aggiungere una quarta forma: una voce in COOKIE_SHAPES (config/brand.ts),
 * una in SHAPE_LABELS e un blocco in `GEOMETRY` qui sotto.
 */

type Dough = {
  base: string;
  shade: string;
  chip: string;
  speck: string;
};

/** Impasti. Sono i colori del biscotto cotto, non gli accent dei gusti. */
const DOUGH: Record<CookieShapeKey, Dough> = {
  life: { base: "#E9C289", shade: "#CDA067", chip: "#3F2617", speck: "#B98A51" },
  energy: { base: "#6E4531", shade: "#553426", chip: "#2A1710", speck: "#8F5F44" },
  potion: { base: "#DCA85F", shade: "#BF8A46", chip: "#3F2617", speck: "#F2DCB4" },
};

type ChipSpec = { x: number; y: number; r: number };

type Geometry = {
  /** Contorno del biscotto. Disegnato due volte: ombra sotto, impasto sopra. */
  path: string;
  /** Spessore dello stroke che arrotonda gli angoli dello stampino. */
  cut: number;
  /** Gocce di cioccolato, posizionate dentro il profilo. */
  chips: ChipSpec[];
  /** Granelli di impasto: rompono la superficie piatta. */
  specks: ChipSpec[];
};

const GEOMETRY: Record<CookieShapeKey, Geometry> = {
  // ♥ LIFE — cuore pieno, lobi asimmetrici come un biscotto fatto a mano.
  life: {
    path: "M60 101 C31 82 14 65 14 47 C14 32 25 21 38 21 C48 21 56 27 60 35 C64 27 72 20 82 20 C96 20 106 32 106 47 C106 66 88 83 60 101 Z",
    cut: 9,
    chips: [
      { x: 42, y: 45, r: 5 },
      { x: 74, y: 41, r: 4.2 },
      { x: 60, y: 58, r: 5.4 },
      { x: 33, y: 62, r: 3.6 },
      { x: 84, y: 60, r: 4.6 },
      { x: 50, y: 76, r: 4 },
      { x: 70, y: 78, r: 3.2 },
    ],
    specks: [
      { x: 52, y: 34, r: 1.6 },
      { x: 88, y: 46, r: 1.4 },
      { x: 40, y: 84, r: 1.5 },
      { x: 63, y: 90, r: 1.3 },
      { x: 26, y: 50, r: 1.4 },
    ],
  },

  // ⚡ ENERGY — fulmine spesso, abbastanza largo da ospitare le gocce.
  energy: {
    path: "M74 12 L36 58 L58 58 L44 108 L86 56 L64 56 Z",
    cut: 11,
    chips: [
      { x: 64, y: 30, r: 3.8 },
      { x: 51, y: 49, r: 4.4 },
      { x: 64, y: 66, r: 4.6 },
      { x: 55, y: 87, r: 3.6 },
    ],
    specks: [
      { x: 69, y: 20, r: 1.4 },
      { x: 58, y: 41, r: 1.3 },
      { x: 71, y: 57, r: 1.5 },
      { x: 50, y: 76, r: 1.4 },
      { x: 49, y: 98, r: 1.3 },
    ],
  },

  // 🧪 POTION — ampolla da laboratorio: collo corto, spalle che si aprono in
  // diagonale, corpo più largo che alto. Il corpo tondo con collo lungo dava
  // una lampadina; queste tre correzioni lo riportano a un'ampolla.
  potion: {
    path: "M49 22 H71 V42 L90 70 Q96 82 88 91 Q76 103 60 103 Q44 103 32 91 Q24 82 30 70 L49 42 Z",
    cut: 9,
    chips: [
      { x: 60, y: 76, r: 5.4 },
      { x: 43, y: 86, r: 4 },
      { x: 76, y: 84, r: 4.4 },
      { x: 59, y: 94, r: 3.6 },
    ],
    specks: [
      { x: 50, y: 65, r: 1.5 },
      { x: 72, y: 64, r: 1.4 },
      { x: 84, y: 92, r: 1.3 },
      { x: 38, y: 96, r: 1.4 },
      { x: 60, y: 32, r: 1.5 },
    ],
  },
};

/**
 * Solo il disegno, senza involucro `<svg>`: serve per innestare il biscotto
 * dentro un'altra illustrazione (la finestra del pacchetto) con un `<g transform>`.
 * Sistema di coordinate 120×120.
 */
export function CookieArt({ shape }: { shape: CookieShapeKey }) {
  const geo = GEOMETRY[shape];
  const dough = DOUGH[shape];

  return (
    <>
      {/* Bordo cotto: stessa sagoma, più scura, spostata sotto. */}
      <g transform="translate(0 4)">
        <path
          d={geo.path}
          fill={dough.shade}
          stroke={dough.shade}
          strokeWidth={geo.cut}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* Superficie. */}
      <path
        d={geo.path}
        fill={dough.base}
        stroke={dough.base}
        strokeWidth={geo.cut}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Granella d'impasto. */}
      {geo.specks.map((s, i) => (
        <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill={dough.speck} opacity={0.75} />
      ))}

      {/* Gocce di cioccolato: mai cerchi perfetti, sempre leggermente schiacciate. */}
      {geo.chips.map((c, i) => (
        <ellipse
          key={`c${i}`}
          cx={c.x}
          cy={c.y}
          rx={c.r}
          ry={c.r * 0.86}
          fill={dough.chip}
          transform={`rotate(${(i * 37) % 90} ${c.x} ${c.y})`}
        />
      ))}
    </>
  );
}

type CookieShapeProps = {
  shape: CookieShapeKey;
  className?: string;
  /** Testo per gli screen reader. Se assente la forma è decorativa. */
  title?: string;
};

export function CookieShape({ shape, className, title }: CookieShapeProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("h-auto w-full", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <CookieArt shape={shape} />
    </svg>
  );
}
