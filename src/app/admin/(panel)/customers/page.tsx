import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Pagination } from "@/components/admin/Pagination";
import { DataTable, EmptyState, PageHeader, Panel, Td, Th } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { db } from "@/lib/db";

const PER_PAGE = 25;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>;
}) {
  const { q, p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        orders: {
          where: { paymentStatus: "PAID" },
          select: { totalCents: true, createdAt: true },
        },
      },
    }),
    db.customer.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Clienti"
        description="Totale speso e ultimo ordine sono calcolati sugli ordini incassati, non su tutti quelli aperti."
      />

      <Panel>
        <div className="mb-5">
          <AdminSearch placeholder="Email o nome…" />
        </div>

        {customers.length === 0 ? (
          <EmptyState
            title={q ? "Nessun cliente trovato" : "Ancora nessun cliente"}
            description={
              q
                ? "Prova con un'altra email o un altro nome."
                : "Un cliente viene creato automaticamente al primo ordine."
            }
          />
        ) : (
          <>
            <DataTable
              head={
                <>
                  <Th>Cliente</Th>
                  <Th>Registrato</Th>
                  <Th>Ordini</Th>
                  <Th>Ultimo ordine</Th>
                  <Th>Newsletter</Th>
                  <Th className="text-right">Totale speso</Th>
                </>
              }
            >
              {customers.map((customer) => {
                const spent = customer.orders.reduce((sum, order) => sum + order.totalCents, 0);
                const last = customer.orders.reduce<Date | null>(
                  (latest, order) =>
                    latest === null || order.createdAt > latest ? order.createdAt : latest,
                  null,
                );

                return (
                  <tr key={customer.id} className="hover:bg-crema/50">
                    <Td>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                      >
                        {[customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
                          "Senza nome"}
                      </Link>
                      <span className="text-cacao-soft block text-xs">{customer.email}</span>
                    </Td>
                    <Td className="text-cacao-soft whitespace-nowrap">
                      {formatDate(customer.createdAt)}
                    </Td>
                    <Td className="tabular-nums">{customer.orders.length}</Td>
                    <Td className="text-cacao-soft whitespace-nowrap">
                      {last ? formatDate(last) : "—"}
                    </Td>
                    <Td className="text-cacao-soft">{customer.marketingConsent ? "Sì" : "—"}</Td>
                    <Td className="text-right font-semibold tabular-nums">{formatPrice(spent)}</Td>
                  </tr>
                );
              })}
            </DataTable>

            <Pagination total={total} page={page} perPage={PER_PAGE} />
          </>
        )}
      </Panel>
    </>
  );
}
