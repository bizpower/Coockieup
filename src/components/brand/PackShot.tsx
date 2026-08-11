import { BRAND_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";
import { CookieArt } from "./CookieShape";

/**
 * La confezione, disegnata come vettore.
 *
 * Non è un segnaposto grigio: è un doypack con saldatura seghettata, base a
 * soffietto, finestra sul prodotto e i tre biscotti dentro. Regge la hero da
 * sola finché non ci sarà la fotografia vera, e usa BRAND_NAME, quindi cambia
 * insieme al brand invece di diventare un file da rifare.
 *
 * Il peso netto è dichiarato "DA CONFERMARE" anche sul pack: la disciplina sui
 * dati non validati vale pure nell'illustrazione.
 */

/** Saldatura superiore: il taglio a zigzag delle buste richiudibili. */
function sealPath(x1: number, x2: number, yPeak: number, yValley: number, yBottom: number) {
  const step = 10;
  const parts = [`M${x1} ${yBottom}`, `L${x1} ${yValley}`];
  let peak = true;
  for (let x = x1 + step; x <= x2; x += step) {
    parts.push(`L${x} ${peak ? yPeak : yValley}`);
    peak = !peak;
  }
  parts.push(`L${x2} ${yBottom}`, "Z");
  return parts.join(" ");
}

const COOKIE_SLOTS = [
  { x: 81, y: 268, rotate: -9 },
  { x: 157, y: 262, rotate: 4 },
  { x: 233, y: 270, rotate: -3 },
] as const;

const FLAVOR_DOTS = [
  { fill: "#E23D2E", cx: 158 },
  { fill: "#F5C518", cx: 190 },
  { fill: "#C98A3F", cx: 222 },
] as const;

export function PackShot({
  className,
  /** Nelle pile l'ombra la disegna solo la busta davanti, non tutte. */
  withShadow = true,
  /** Le buste dietro non vanno rilette dagli screen reader. */
  decorative = false,
}: {
  className?: string;
  withShadow?: boolean;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 380 520"
      className={cn("h-auto w-full", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={
        decorative ? undefined : `Confezione ${BRAND_NAME}: 15 mini cookie proteici, tre gusti`
      }
    >
      {/* Ombra a terra: calda, mai grigia. */}
      {withShadow && <ellipse cx="190" cy="496" rx="132" ry="16" fill="#241812" opacity="0.14" />}

      {/* Corpo della busta, con la leggera bombatura di un pack pieno. */}
      <path
        d="M52 70 C48 190 48 340 54 448 Q56 486 92 486 H288 Q324 486 326 448 C332 340 332 190 328 70 Z"
        fill="#F4EADA"
      />

      {/* Base a soffietto: la fascia che permette al pack di stare in piedi. */}
      <path
        d="M56 424 Q190 450 324 424 L326 448 Q324 486 288 486 H92 Q56 486 54 448 Z"
        fill="#E8D9BE"
      />

      {/* Saldatura superiore. */}
      <path d={sealPath(40, 340, 32, 44, 78)} fill="#241812" />

      {/* Occhiello. */}
      <text
        x="190"
        y="112"
        textAnchor="middle"
        className="font-sans"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="3.4"
        fill="#6B5445"
      >
        MINI PROTEIN COOKIES
      </text>

      {/* Marchio. */}
      <text
        x="190"
        y="170"
        textAnchor="middle"
        className="font-display"
        fontSize="54"
        fontWeight="800"
        letterSpacing="-2.4"
        fill="#241812"
      >
        {BRAND_NAME}
        <tspan fill="#FF4B26">.</tspan>
      </text>

      {/* Pastiglia con la promessa numerica. */}
      <rect x="122" y="184" width="136" height="27" rx="13.5" fill="#FF4B26" />
      <text
        x="190"
        y="202"
        textAnchor="middle"
        className="font-sans"
        fontSize="11"
        fontWeight="800"
        letterSpacing="2"
        fill="#241812"
      >
        15 MINI COOKIE
      </text>

      {/* Finestra sul prodotto: il biscotto si vede prima di comprarlo. */}
      <rect
        x="68"
        y="232"
        width="244"
        height="156"
        rx="78"
        fill="#FDFBF6"
        stroke="#241812"
        strokeWidth="2.5"
      />

      {COOKIE_SLOTS.map((slot, i) => (
        <g
          key={slot.x}
          transform={`translate(${slot.x} ${slot.y}) scale(0.55) rotate(${slot.rotate} 60 60)`}
        >
          <CookieArt shape={(["life", "energy", "potion"] as const)[i]!} />
        </g>
      ))}

      {/* Tre gusti, tre colori. */}
      {FLAVOR_DOTS.map((dot) => (
        <circle key={dot.cx} cx={dot.cx} cy="414" r="6.5" fill={dot.fill} />
      ))}
      <text
        x="190"
        y="443"
        textAnchor="middle"
        className="font-sans"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="2.6"
        fill="#241812"
      >
        3 GUSTI
      </text>

      {/* Il dato non validato resta dichiarato tale anche sul pack. */}
      <text
        x="190"
        y="468"
        textAnchor="middle"
        className="font-sans"
        fontSize="8"
        fontWeight="600"
        letterSpacing="1.4"
        fill="#6B5445"
      >
        PESO NETTO [DA CONFERMARE]
      </text>
    </svg>
  );
}

/**
 * Più confezioni a ventaglio, per le card dei bundle.
 *
 * `count` è il numero di box della variante: 1, 3, 6 o qualunque altro valore
 * inserito dall'admin. Le buste visibili si fermano a tre — oltre, il ventaglio
 * diventa una macchia — quindi da quattro in su compare la pastiglia "×N", che
 * è ciò che distingue davvero un 6 box da un 3 box.
 *
 * Le buste laterali si aprono in modo simmetrico e quella centrale sta davanti:
 * un ventaglio che pende tutto da un lato sembra una pila caduta.
 */
export function PackStack({ count, className }: { count: number; className?: string }) {
  const visible = Math.min(Math.max(count, 1), 3);

  // Posizioni simmetriche attorno allo zero, disegnate dalle esterne alla
  // centrale: l'ultima renderizzata è quella davanti.
  const offsets = Array.from({ length: visible }, (_, i) => i - (visible - 1) / 2).sort(
    (a, b) => Math.abs(b) - Math.abs(a),
  );

  return (
    <div className={cn("relative", className)}>
      {offsets.map((offset, index) => {
        const isFront = offset === 0;
        return (
          <div
            key={offset}
            className={cn(index > 0 && "absolute inset-0")}
            style={{
              transform: `translateX(${offset * 21}%) rotate(${offset * 8}deg) scale(${isFront ? 1 : 0.93})`,
              transformOrigin: "50% 90%",
              zIndex: index,
            }}
          >
            <PackShot withShadow={isFront} decorative={!isFront} />
          </div>
        );
      })}

      {count > visible && (
        <span
          className="bg-cacao text-panna font-display absolute right-0 bottom-1 z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold"
          aria-hidden="true"
        >
          ×{count}
        </span>
      )}
    </div>
  );
}
