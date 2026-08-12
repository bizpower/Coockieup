import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { OrderEmailPanel } from "@/components/admin/OrderEmailPanel";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { db } from "@/lib/db";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });

  if (!order) notFound();

  return (
    <>
      <Link
        href="/admin/orders"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Tutti gli ordini
      </Link>

      <PageHeader
        title={order.number}
        description={`Ricevuto il ${formatDate(order.createdAt)} · ${order.email}`}
        action={
          <div className="flex gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        }
      />

      {order.isDemo && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm font-medium">
          Ordine di prova. Non entra nei KPI della dashboard e va eliminato prima
          dell&apos;apertura del negozio.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Articoli">
            <ul className="divide-cacao-line divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-6 py-3.5">
                  <span>
                    <span className="font-semibold">{item.nameSnapshot}</span>
                    <span className="text-cacao-soft block text-sm">
                      {item.variantSnapshot} · {item.skuSnapshot} · {formatPrice(item.unitPriceCents)}{" "}
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(item.unitPriceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="border-cacao-line mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-cacao-soft">Subtotale</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="text-success flex justify-between">
                  <dt>Sconto{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-cacao-soft">Spedizione</dt>
                <dd className="tabular-nums">
                  {order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}
                </dd>
              </div>
              <div className="border-cacao-line flex justify-between border-t pt-2.5 text-base">
                <dt className="font-display font-extrabold">Totale</dt>
                <dd className="font-display font-extrabold tabular-nums">
                  {formatPrice(order.totalCents)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Spedizione">
            <address className="text-[0.9375rem] leading-relaxed not-italic">
              <span className="font-semibold">{order.shippingName}</span>
              <br />
              {order.shippingLine1}
              {order.shippingLine2 && (
                <>
                  <br />
                  {order.shippingLine2}
                </>
              )}
              <br />
              {order.shippingZip} {order.shippingCity}
              {order.shippingState && ` (${order.shippingState})`}
              <br />
              {order.shippingCountry}
              {order.shippingPhone && (
                <>
                  <br />
                  <span className="text-cacao-soft">Tel. {order.shippingPhone}</span>
                </>
              )}
            </address>

            {order.customerNote && (
              <div className="bg-crema mt-5 rounded-xl p-4">
                <p className="text-cacao-soft text-xs font-bold uppercase">Nota del cliente</p>
                <p className="mt-1.5 text-sm leading-relaxed">{order.customerNote}</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Avanzamento">
            <OrderActions
              orderId={order.id}
              status={order.status}
              trackingCode={order.trackingCode}
              adminNote={order.adminNote}
            />
          </Panel>

          <Panel title="Email di conferma">
            <OrderEmailPanel
              orderId={order.id}
              email={order.email}
              sentAt={order.confirmationEmailSentAt?.toISOString() ?? null}
              error={order.confirmationEmailError}
            />
          </Panel>

          <Panel title="Pagamento">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-cacao-soft">Metodo</dt>
                <dd className="font-medium">
                  {order.paymentProvider === "stripe" ? "Carta (Stripe)" : "Bonifico"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cacao-soft">Stato</dt>
                <dd>
                  <StatusBadge status={order.paymentStatus} />
                </dd>
              </div>
              {order.paymentRef && (
                <div className="flex justify-between gap-4">
                  <dt className="text-cacao-soft">Riferimento</dt>
                  <dd className="max-w-[12rem] truncate font-mono text-xs">{order.paymentRef}</dd>
                </div>
              )}
            </dl>
          </Panel>

          {order.customer && (
            <Panel title="Cliente">
              <Link
                href={`/admin/customers/${order.customer.id}`}
                className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
              >
                {order.customer.firstName} {order.customer.lastName}
              </Link>
              <p className="text-cacao-soft mt-1 text-sm">{order.customer.email}</p>
              {order.customer.marketingConsent && (
                <p className="text-cacao-soft mt-2 text-xs">Iscritto alla newsletter</p>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
