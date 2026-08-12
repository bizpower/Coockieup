import Link from "next/link";
import { BRAND_LEGAL, BRAND_NAME } from "@/config/brand";
import { DemoDataCleanup, LegalPagesEditor } from "@/components/admin/SettingsPanels";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getLaunchChecklist } from "@/services/launch-checklist";
import { cn } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const [checklist, legalPages, demoReviews, demoOrders] = await Promise.all([
    getLaunchChecklist(),
    db.legalPage.findMany({ orderBy: { slug: "asc" } }),
    db.review.count({ where: { isDemo: true } }),
    db.order.count({ where: { isDemo: true } }),
  ]);

  const blocking = checklist.filter((item) => item.blocking && !item.done);
  const done = checklist.filter((item) => item.done).length;

  return (
    <>
      <PageHeader
        title="Impostazioni"
        description="Cosa manca prima di aprire gli ordini, pagine legali e pulizia dei dati di collaudo."
      />

      <Panel
        title="Prima del lancio"
        description={`${done} di ${checklist.length} voci completate. Questa lista non è scritta a mano: interroga il database e l'ambiente a ogni caricamento.`}
      >
        {blocking.length > 0 && (
          <p className="border-danger bg-fiamma-wash text-danger mb-5 border-l-4 px-4 py-3 text-sm font-semibold">
            {blocking.length} {blocking.length === 1 ? "voce bloccante" : "voci bloccanti"} non
            {blocking.length === 1 ? " è" : " sono"} ancora risolte. Il negozio non dovrebbe aprire così.
          </p>
        )}

        <ul className="divide-cacao-line divide-y">
          {checklist.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  item.done
                    ? "bg-success text-panna"
                    : item.blocking
                      ? "bg-fiamma text-cacao"
                      : "bg-crema-deep text-cacao-soft",
                )}
              >
                {item.done ? "✓" : item.blocking ? "!" : "·"}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className={cn(item.done && "text-cacao-soft line-through")}>
                    {item.label}
                  </span>
                  {!item.done && !item.blocking && (
                    <span className="text-cacao-soft text-xs font-normal">non bloccante</span>
                  )}
                </p>
                <p className="text-cacao-soft mt-1 text-sm leading-relaxed">{item.detail}</p>
                {item.href && !item.done && (
                  <Link
                    href={item.href}
                    className="text-fiamma-deep mt-1.5 inline-block text-sm font-semibold underline underline-offset-2"
                  >
                    Vai a sistemarlo
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6">
        <Panel
          title="Pagine legali"
          description="Contenuti segnaposto da far redigere o validare da un consulente."
        >
          <LegalPagesEditor pages={legalPages} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Dati di esempio">
          <DemoDataCleanup demoReviews={demoReviews} demoOrders={demoOrders} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Identità del brand"
          description="Questi valori stanno nel codice, in config/brand.ts, non nel database: cambiarli è un rilascio, non una modifica al volo."
        >
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-4">
              <dt className="text-cacao-soft w-44 shrink-0">Nome del brand</dt>
              <dd className="font-semibold">{BRAND_NAME}</dd>
            </div>
            <div className="flex flex-wrap gap-4">
              <dt className="text-cacao-soft w-44 shrink-0">Ragione sociale</dt>
              <dd className={cn(BRAND_LEGAL.companyName.startsWith("[") && "text-warning font-semibold")}>
                {BRAND_LEGAL.companyName}
              </dd>
            </div>
            <div className="flex flex-wrap gap-4">
              <dt className="text-cacao-soft w-44 shrink-0">Partita IVA</dt>
              <dd className={cn(BRAND_LEGAL.vatId.startsWith("[") && "text-warning font-semibold")}>
                {BRAND_LEGAL.vatId}
              </dd>
            </div>
            <div className="flex flex-wrap gap-4">
              <dt className="text-cacao-soft w-44 shrink-0">Email assistenza</dt>
              <dd>{BRAND_LEGAL.supportEmail}</dd>
            </div>
          </dl>

          <p className="text-cacao-soft mt-5 text-sm leading-relaxed">
            Il nome compare in navbar, footer, metadata, dati strutturati, numerazione ordini
            e nel disegno della confezione. Cambiarlo richiede la modifica di una sola riga.
          </p>
        </Panel>
      </div>
    </>
  );
}
