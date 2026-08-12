import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, PageHeader, Panel, StatCard, StatusBadge, Td, Th } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { db } from "@/lib/db";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) notFound();

  const paid = customer.orders.filter((order) => order.paymentStatus === "PAID");
  const spent = paid.reduce((sum, order) => sum + order.totalCents, 0);
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Senza nome";

  return (
    <>
      <Link
        href="/admin/customers"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Tutti i clienti
      </Link>

      <PageHeader title={name} description={customer.email} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ordini incassati" value={String(paid.length)} />
        <StatCard label="Totale speso" value={formatPrice(spent)} tone="brand" />
        <StatCard
          label="Scontrino medio"
          value={paid.length > 0 ? formatPrice(Math.round(spent / paid.length)) : "—"}
        />
      </div>

      <div className="mt-6">
        <Panel title="Ordini">
          <DataTable
            head={
              <>
                <Th>Ordine</Th>
                <Th>Data</Th>
                <Th>Stato</Th>
                <Th className="text-right">Totale</Th>
              </>
            }
          >
            {customer.orders.map((order) => (
              <tr key={order.id} className="hover:bg-crema/50">
                <Td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                  >
                    {order.number}
                  </Link>
                </Td>
                <Td className="text-cacao-soft whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                <Td>
                  <StatusBadge status={order.status} />
                </Td>
                <Td className="text-right font-semibold tabular-nums">
                  {formatPrice(order.totalCents)}
                </Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Contatti">
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-4">
              <dt className="text-cacao-soft w-32 shrink-0">Email</dt>
              <dd>{customer.email}</dd>
            </div>
            {customer.phone && (
              <div className="flex gap-4">
                <dt className="text-cacao-soft w-32 shrink-0">Telefono</dt>
                <dd>{customer.phone}</dd>
              </div>
            )}
            <div className="flex gap-4">
              <dt className="text-cacao-soft w-32 shrink-0">Newsletter</dt>
              <dd>{customer.marketingConsent ? "Ha dato il consenso" : "Nessun consenso"}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-cacao-soft w-32 shrink-0">Cliente dal</dt>
              <dd>{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
