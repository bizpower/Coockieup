import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  Td,
  Th,
  STATUS_LABELS,
} from "@/components/admin/ui";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Pagination } from "@/components/admin/Pagination";
import { formatDate, formatPrice } from "@/lib/format";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const PER_PAGE = 25;

const FILTERS = ["", "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stato?: string; p?: string }>;
}) {
  const { q, stato, p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(stato && FILTERS.includes(stato as (typeof FILTERS)[number])
      ? { status: stato as Prisma.EnumOrderStatusFilter["equals"] }
      : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { shippingName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Ordini"
        description="Cerca per numero, email o nome. Il filtro e la ricerca restano nell'indirizzo, quindi la vista è condivisibile."
      />

      <Panel>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <AdminSearch placeholder="Numero, email o nome…" />

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((filter) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (filter) params.set("stato", filter);
              const active = (stato ?? "") === filter;

              return (
                <Link
                  key={filter || "tutti"}
                  href={`/admin/orders${params.size ? `?${params}` : ""}`}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    active ? "bg-cacao text-panna" : "bg-crema text-cacao-soft hover:text-cacao",
                  )}
                >
                  {filter ? STATUS_LABELS[filter] : "Tutti"}
                </Link>
              );
            })}
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={q || stato ? "Nessun ordine con questi criteri" : "Ancora nessun ordine"}
            description={
              q || stato
                ? "Prova a togliere il filtro o a cercare qualcos'altro."
                : "Quando arriverà il primo ordine lo troverai qui, con tutto quello che serve per prepararlo e spedirlo."
            }
          />
        ) : (
          <>
            <DataTable
              head={
                <>
                  <Th>Ordine</Th>
                  <Th>Cliente</Th>
                  <Th>Data</Th>
                  <Th>Articoli</Th>
                  <Th>Stato</Th>
                  <Th>Pagamento</Th>
                  <Th className="text-right">Totale</Th>
                </>
              }
            >
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-crema/50">
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                    >
                      {order.number}
                    </Link>
                    {order.isDemo && (
                      <span className="text-cacao-soft ml-2 text-xs font-bold">prova</span>
                    )}
                  </Td>
                  <Td>
                    <span className="block font-medium">{order.shippingName}</span>
                    <span className="text-cacao-soft block text-xs">{order.email}</span>
                  </Td>
                  <Td className="text-cacao-soft whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </Td>
                  <Td className="text-cacao-soft tabular-nums">{order._count.items}</Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={order.paymentStatus} />
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">
                    {formatPrice(order.totalCents)}
                  </Td>
                </tr>
              ))}
            </DataTable>

            <Pagination total={total} page={page} perPage={PER_PAGE} />
          </>
        )}
      </Panel>
    </>
  );
}
