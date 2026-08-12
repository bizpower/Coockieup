import { formatPrice } from "@/lib/format";

/**
 * Fatturato giornaliero.
 *
 * Una serie sola, quindi nessuna legenda: il titolo del riquadro dice già cosa
 * si sta guardando. Etichetta diretta solo sul giorno migliore — un numero
 * sopra ogni barra sarebbe una tabella disegnata male.
 *
 * SVG renderizzato sul server: nessuna libreria di grafici nel bundle. Il
 * passaggio del mouse usa `<title>`, che è nativo, funziona da tastiera nei
 * lettori di schermo e non costa un byte di JavaScript. Sotto, la stessa
 * informazione in tabella per chi non può leggere il disegno.
 */

const WIDTH = 560;
const HEIGHT = 170;
const PAD_TOP = 22;
const PAD_BOTTOM = 26;
const PAD_X = 4;
const GAP = 2;
const RADIUS = 4;

/** Barra con i soli angoli superiori arrotondati, ancorata alla linea di base. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, width / 2, height);
  const bottom = y + height;
  return [
    `M${x} ${bottom}`,
    `V${y + r}`,
    `Q${x} ${y} ${x + r} ${y}`,
    `H${x + width - r}`,
    `Q${x + width} ${y} ${x + width} ${y + r}`,
    `V${bottom}`,
    "Z",
  ].join(" ");
}

function dayLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function RevenueChart({ data }: { data: { date: string; cents: number }[] }) {
  if (data.length === 0) {
    return <p className="text-cacao-soft py-10 text-center text-sm">Nessun dato da mostrare.</p>;
  }

  const max = Math.max(...data.map((d) => d.cents));
  const total = data.reduce((sum, d) => sum + d.cents, 0);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = (WIDTH - PAD_X * 2) / data.length;
  const barWidth = Math.max(2, slot - GAP);
  const baseline = PAD_TOP + plotHeight;
  const peakIndex = data.findIndex((d) => d.cents === max && max > 0);

  if (total === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-cacao-soft text-sm">
          Nessun incasso negli ultimi {data.length} giorni.
        </p>
        <p className="text-cacao-soft mt-1 text-xs">
          Il grafico si popola con il primo ordine pagato.
        </p>
      </div>
    );
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Fatturato degli ultimi ${data.length} giorni. Totale ${formatPrice(total)}, massimo giornaliero ${formatPrice(max)}.`}
      >
        {/* Linea di base: presente ma discreta, non compete con i dati. */}
        <line
          x1={PAD_X}
          y1={baseline + 0.5}
          x2={WIDTH - PAD_X}
          y2={baseline + 0.5}
          stroke="#D9C9B0"
          strokeWidth="1"
        />

        {data.map((point, index) => {
          const x = PAD_X + index * slot;
          const height = max > 0 ? (point.cents / max) * plotHeight : 0;
          const y = baseline - height;
          const label = `${dayLabel(point.date)}: ${formatPrice(point.cents)}`;

          // I giorni a zero restano visibili come tacca: una barra assente si
          // confonde con un giorno mancante dalla serie.
          if (point.cents === 0) {
            return (
              <rect key={point.date} x={x} y={baseline - 2} width={barWidth} height={2} fill="#E8D9BE">
                <title>{label}</title>
              </rect>
            );
          }

          return (
            <path key={point.date} d={barPath(x, y, barWidth, height)} fill="#FF4B26">
              <title>{label}</title>
            </path>
          );
        })}

        {/* Etichetta diretta solo sul picco. */}
        {peakIndex >= 0 && (
          <text
            x={Math.min(
              WIDTH - PAD_X - 30,
              Math.max(PAD_X + 30, PAD_X + peakIndex * slot + barWidth / 2),
            )}
            y={baseline - (data[peakIndex]!.cents / max) * plotHeight - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#241812"
          >
            {formatPrice(max)}
          </text>
        )}

        <text x={PAD_X} y={HEIGHT - 8} fontSize="10" fill="#6B5445">
          {dayLabel(data[0]!.date)}
        </text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 8} fontSize="10" fill="#6B5445" textAnchor="end">
          {dayLabel(data[data.length - 1]!.date)}
        </text>
      </svg>

      <figcaption className="text-cacao-soft mt-3 text-sm">
        Totale del periodo: <span className="text-cacao font-semibold">{formatPrice(total)}</span>
      </figcaption>

      {/* Stessa informazione, leggibile senza vedere il grafico. */}
      <details className="mt-3">
        <summary className="text-cacao-soft hover:text-cacao cursor-pointer text-xs font-semibold">
          Vedi i dati in tabella
        </summary>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-cacao-soft border-cacao-line border-b text-xs">
              <th scope="col" className="py-2 font-bold uppercase">
                Giorno
              </th>
              <th scope="col" className="py-2 text-right font-bold uppercase">
                Incassato
              </th>
            </tr>
          </thead>
          <tbody className="divide-cacao-line divide-y">
            {data.map((point) => (
              <tr key={point.date}>
                <td className="py-1.5">{dayLabel(point.date)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatPrice(point.cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
