import type { Review } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { StarIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import type { ContentValue } from "@/services/content";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={className} aria-label={`${rating} stelle su 5`}>
      <span aria-hidden="true" className="text-fiamma flex gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <StarIcon key={value} filled={value <= Math.round(rating)} />
        ))}
      </span>
    </span>
  );
}

/**
 * Le recensioni.
 *
 * Quelle marcate `isDemo` sono contenuti di esempio e vengono dichiarate come
 * tali in pagina. Non alimentano l'AggregateRating strutturato: dire a Google
 * che un prodotto non ancora in vendita ha una media di 4,7 è esattamente il
 * tipo di dichiarazione che si paga con una penalizzazione.
 */
export function SocialProof({
  content,
  reviews,
}: {
  content: ContentValue<"socialProof">;
  reviews: Review[];
}) {
  if (reviews.length === 0) return null;

  const hasDemo = reviews.some((review) => review.isDemo);

  return (
    <Section tone="crema" aria-labelledby="recensioni-titolo">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 id="recensioni-titolo" className="text-display mt-4">
              {content.title}
            </h2>
          </div>
          {hasDemo && <Badge tone="outline">Contenuti di esempio</Badge>}
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="bg-panna rounded-card border-cacao-line flex flex-col border p-7"
            >
              <Stars rating={review.rating} className="text-lg" />
              {review.title && (
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">{review.title}</h3>
              )}
              <p className="text-cacao-soft mt-2.5 flex-1 text-[0.9375rem] leading-relaxed">
                {review.body}
              </p>
              <p className="text-cacao-soft mt-5 text-sm font-semibold">{review.authorName}</p>
            </li>
          ))}
        </ul>

        {hasDemo && (
          <p className="text-cacao-soft mt-8 max-w-2xl text-sm leading-relaxed">
            Le recensioni qui sopra sono segnaposto scritti per costruire la
            pagina. Vengono eliminate in blocco dall&apos;area amministrativa
            prima dell&apos;apertura degli ordini, e non contribuiscono ad
            alcuna valutazione dichiarata ai motori di ricerca.
          </p>
        )}
      </Container>
    </Section>
  );
}
