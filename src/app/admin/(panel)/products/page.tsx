import Link from "next/link";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  Td,
  Th,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";
import { db } from "@/lib/db";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      _count: { select: { nutrition: true, ingredients: true, allergens: true } },
    },
  });

  // Quante voci sono ancora dichiarate non validate: è il numero che dice se
  // il catalogo è pronto per il lancio.
  const pending = await db.$transaction([
    db.nutritionFact.count({ where: { isConfirmed: false } }),
    db.ingredient.count({ where: { isConfirmed: false } }),
    db.allergen.count({ where: { isConfirmed: false } }),
  ]);
  const unconfirmed = pending.reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader
        title="Prodotti"
        description="Formati, prezzi, giacenze e dati di etichetta."
      />

      {unconfirmed > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm leading-relaxed font-medium">
          Ci sono <strong>{unconfirmed}</strong> voci fra valori nutrizionali, ingredienti e
          allergeni ancora non confermate. Sul sito compaiono con il badge DA CONFERMARE, ed è
          giusto così finché la ricetta non è chiusa.
        </p>
      )}

      <Panel>
        {products.length === 0 ? (
          <EmptyState
            title="Nessun prodotto"
            description="Il catalogo è vuoto. Lancia `npm run db:seed` per ripristinare il prodotto di partenza."
          />
        ) : (
          <DataTable
            head={
              <>
                <Th>Prodotto</Th>
                <Th>Stato</Th>
                <Th>Formati</Th>
                <Th>Prezzi</Th>
                <Th className="text-right">Giacenza</Th>
              </>
            }
          >
            {products.map((product) => {
              const active = product.variants.filter((v) => v.isActive);
              const totalStock = active.reduce((sum, v) => sum + v.stock, 0);
              const prices = active.map((v) => v.priceCents);

              return (
                <tr key={product.id} className="hover:bg-crema/50">
                  <Td>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="text-cacao-soft block text-xs">/{product.slug}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={product.status} />
                  </Td>
                  <Td className="text-cacao-soft tabular-nums">
                    {active.length}
                    {product.variants.length !== active.length &&
                      ` (${product.variants.length - active.length} disattivi)`}
                  </Td>
                  <Td className="text-cacao-soft tabular-nums">
                    {prices.length === 0
                      ? "—"
                      : `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`}
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{totalStock}</Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
