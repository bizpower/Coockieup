import Link from "next/link";
import { PackStack } from "@/components/brand/PackShot";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatPrice } from "@/lib/format";

/**
 * Scheda prodotto per le griglie.
 *
 * Mostra il prezzo del formato più economico ("da X €") invece di quello del
 * formato consigliato: in una lista il prezzo serve a far capire la fascia,
 * non a spingere il bundle. La spinta sta nella scheda prodotto.
 */
export function ProductCard({
  slug,
  name,
  subtitle,
  variants,
}: {
  slug: string;
  name: string;
  subtitle: string | null;
  variants: { priceCents: number; compareAtCents: number | null; boxCount: number }[];
}) {
  const cheapest = variants.reduce<(typeof variants)[number] | null>(
    (best, variant) => (best === null || variant.priceCents < best.priceCents ? variant : best),
    null,
  );

  const bestSaving = variants.reduce<number>((max, variant) => {
    const saving = discountPercent(variant.priceCents, variant.compareAtCents) ?? 0;
    return Math.max(max, saving);
  }, 0);

  const soldOut = cheapest === null;

  return (
    <article className="group border-cacao-line rounded-card hover:border-cacao relative flex h-full flex-col border-2 p-6 transition-colors sm:p-7">
      <div className="flex min-h-7 items-start justify-between gap-3">
        <Badge tone="neutral">{variants.length} formati</Badge>
        {bestSaving > 0 && <Badge tone="dark">fino a −{bestSaving}%</Badge>}
      </div>

      <Link
        href={`/product/${slug}`}
        className="mx-auto my-6 block w-full max-w-[13rem] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-1.5"
        tabIndex={-1}
        aria-hidden="true"
      >
        <PackStack count={1} />
      </Link>

      <h2 className="text-title">
        {/* Il link copre tutta la scheda ma resta un solo elemento focalizzabile. */}
        <Link href={`/product/${slug}`} className="after:absolute after:inset-0">
          {name}
        </Link>
      </h2>
      {subtitle && <p className="text-cacao-soft mt-1.5 text-sm">{subtitle}</p>}

      <p className="mt-5 flex items-baseline gap-2">
        {soldOut ? (
          <span className="text-cacao-soft font-semibold">Non disponibile</span>
        ) : (
          <>
            <span className="text-cacao-soft text-sm">da</span>
            <span className="font-display text-2xl font-extrabold tracking-tight tabular-nums">
              {formatPrice(cheapest.priceCents)}
            </span>
          </>
        )}
      </p>
    </article>
  );
}
