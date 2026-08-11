import type { ProductVariant } from "@prisma/client";
import { PackStack } from "@/components/brand/PackShot";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { discountPercent, formatPrice, formatUnitPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * I bundle in homepage.
 *
 * Le confezioni sono varianti del prodotto, lette dal database e ordinate
 * dall'admin: un box da 12 o un'edizione stagionale compaiono qui senza che
 * questo file cambi. Il "consigliato" è la variante marcata `isDefault`.
 */
export function BundleTeaser({
  variants,
  productSlug,
}: {
  variants: ProductVariant[];
  productSlug: string;
}) {
  if (variants.length === 0) return null;

  return (
    <Section aria-labelledby="bundle-titolo">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Formati</Eyebrow>
          <h2 id="bundle-titolo" className="text-display mt-4">
            Uno è per provare.
            <br />
            Sei è per non rimanere a secco.
          </h2>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {variants.map((variant) => {
            const saving = discountPercent(variant.priceCents, variant.compareAtCents);
            const soldOut = variant.stock <= 0;

            return (
              <li key={variant.id}>
                <article
                  className={cn(
                    "rounded-card flex h-full flex-col border-2 p-7 transition-colors sm:p-8",
                    variant.isDefault
                      ? "border-fiamma bg-fiamma-wash"
                      : "border-cacao-line hover:border-cacao",
                  )}
                >
                  <div className="flex min-h-7 items-start justify-between gap-3">
                    {variant.badge ? (
                      <Badge tone={variant.isDefault ? "brand" : "neutral"}>{variant.badge}</Badge>
                    ) : (
                      <span />
                    )}
                    {saving && <Badge tone="dark">−{saving}%</Badge>}
                  </div>

                  <div className="mx-auto my-6 w-full max-w-[11rem]">
                    <PackStack count={variant.boxCount} />
                  </div>

                  <h3 className="text-title">{variant.name}</h3>
                  <p className="text-cacao-soft mt-1 text-sm">
                    {variant.boxCount * 15} mini cookie in totale
                  </p>

                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="font-display text-3xl font-extrabold tracking-tight">
                      {formatPrice(variant.priceCents)}
                    </span>
                    {variant.compareAtCents && (
                      <span className="text-cacao-soft text-base line-through">
                        {formatPrice(variant.compareAtCents)}
                      </span>
                    )}
                  </div>

                  {variant.boxCount > 1 && (
                    <p className="text-cacao-soft mt-1 text-sm">
                      {formatUnitPrice(variant.priceCents, variant.boxCount)} a confezione
                    </p>
                  )}

                  <ButtonLink
                    href={`/product/${productSlug}?variante=${variant.sku}`}
                    variant={variant.isDefault ? "primary" : "outline"}
                    className="mt-7 w-full"
                    aria-label={`Acquista ${variant.name} — ${formatPrice(variant.priceCents)}`}
                  >
                    {soldOut ? "Avvisami" : "Acquista"}
                    <ArrowRightIcon />
                  </ButtonLink>
                </article>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
