import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmableEditor,
  ProductDetailsForm,
  VariantEditor,
} from "@/components/admin/ProductForms";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { orderItems: true } } },
      },
      nutrition: { orderBy: { sortOrder: "asc" } },
      ingredients: { orderBy: { sortOrder: "asc" } },
      allergens: { orderBy: { sortOrder: "asc" } },
      flavors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) notFound();

  return (
    <>
      <Link
        href="/admin/products"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Tutti i prodotti
      </Link>

      <PageHeader
        title={product.name}
        description={product.subtitle ?? undefined}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={product.status} />
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="text-cacao-soft hover:text-fiamma text-sm font-semibold underline-offset-2 hover:underline"
            >
              Vedi sul sito
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <Panel title="Anagrafica">
          <ProductDetailsForm product={product} />
        </Panel>

        <Panel
          title="Formati e prezzi"
          description="I bundle sono formati: aggiungerne uno nuovo non richiede modifiche al codice."
        >
          <VariantEditor
            productId={product.id}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              boxCount: variant.boxCount,
              priceCents: variant.priceCents,
              compareAtCents: variant.compareAtCents,
              stock: variant.stock,
              badge: variant.badge,
              isActive: variant.isActive,
              isDefault: variant.isDefault,
              orderCount: variant._count.orderItems,
            }))}
          />
        </Panel>

        <Panel
          title="Valori nutrizionali"
          description="Finché una voce non è confermata, il sito la mostra come obiettivo di formulazione."
        >
          <ConfirmableEditor
            productId={product.id}
            kind="nutrition"
            rows={product.nutrition.map((fact) => ({
              id: fact.id,
              label: fact.label,
              value: fact.value,
              unit: fact.unit,
              isHighlight: fact.isHighlight,
              isConfirmed: fact.isConfirmed,
            }))}
          />
        </Panel>

        <Panel title="Ingredienti">
          <ConfirmableEditor
            productId={product.id}
            kind="ingredients"
            rows={product.ingredients.map((ingredient) => ({
              id: ingredient.id,
              name: ingredient.name,
              note: ingredient.note,
              isConfirmed: ingredient.isConfirmed,
            }))}
          />
        </Panel>

        <Panel
          title="Allergeni"
          description="Nessuna assenza viene dichiarata sul sito finché la voce non è confermata."
        >
          <ConfirmableEditor
            productId={product.id}
            kind="allergens"
            rows={product.allergens.map((allergen) => ({
              id: allergen.id,
              label: allergen.label,
              isPresent: allergen.isPresent,
              isConfirmed: allergen.isConfirmed,
            }))}
          />
        </Panel>

        <Panel title="Gusti collegati" description="Si gestiscono dal seed o direttamente dal database.">
          <ul className="flex flex-wrap gap-2">
            {product.flavors.map((flavor) => (
              <li
                key={flavor.id}
                className="bg-crema flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: flavor.colorHex }}
                  aria-hidden="true"
                />
                {flavor.name}
                <span className="text-cacao-soft font-normal">({flavor.shapeLabel})</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
