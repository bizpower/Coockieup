import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mattoni dell'area amministrativa.
 *
 * Stanno insieme in un file perché sono piccoli e si usano sempre in
 * combinazione: spargerli in otto file renderebbe più lungo l'import che
 * il componente.
 */

/** Intestazione di pagina: titolo, spiegazione e azione principale. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="text-cacao-soft mt-1.5 max-w-2xl text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/** Riquadro contenuto. */
export function Panel({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn("border-cacao-line bg-panna rounded-2xl border", className)}>
      {(title || description) && (
        <div className="border-cacao-line border-b px-5 py-4">
          {title && <h2 className="font-display text-lg font-extrabold tracking-tight">{title}</h2>}
          {description && <p className="text-cacao-soft mt-1 text-sm">{description}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Numero singolo con etichetta. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "brand" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        tone === "brand" ? "border-fiamma bg-fiamma-wash" : "border-cacao-line bg-panna",
      )}
    >
      <p className="text-cacao-soft text-sm font-semibold">{label}</p>
      <p
        className={cn(
          "font-display mt-1.5 text-3xl font-extrabold tracking-tight tabular-nums",
          tone === "muted" && "text-cacao-soft",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-cacao-soft mt-1 text-xs">{hint}</p>}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  PENDING: "bg-energy-wash text-warning",
  PAID: "bg-crema text-cacao",
  PROCESSING: "bg-crema text-cacao",
  SHIPPED: "bg-fiamma-wash text-fiamma-deep",
  DELIVERED: "bg-success/12 text-success",
  CANCELLED: "bg-crema text-cacao-soft",
  REFUNDED: "bg-crema text-cacao-soft",
  UNPAID: "bg-energy-wash text-warning",
  FAILED: "bg-fiamma-wash text-danger",
  DRAFT: "bg-crema text-cacao-soft",
  SCHEDULED: "bg-energy-wash text-warning",
  PUBLISHED: "bg-success/12 text-success",
  ACTIVE: "bg-success/12 text-success",
  ARCHIVED: "bg-crema text-cacao-soft",
  SUBSCRIBED: "bg-success/12 text-success",
  UNSUBSCRIBED: "bg-crema text-cacao-soft",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa",
  PAID: "Pagato",
  PROCESSING: "In preparazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
  UNPAID: "Da saldare",
  FAILED: "Fallito",
  DRAFT: "Bozza",
  SCHEDULED: "Programmato",
  PUBLISHED: "Pubblicato",
  ACTIVE: "Attivo",
  ARCHIVED: "Archiviato",
  SUBSCRIBED: "Iscritto",
  UNSUBSCRIBED: "Disiscritto",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        STATUS_TONES[status] ?? "bg-crema text-cacao-soft",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Tabella con intestazione fissa e scorrimento orizzontale su schermi stretti. */
export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-cacao-line text-cacao-soft border-b text-xs">{head}</tr>
        </thead>
        <tbody className="divide-cacao-line divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("py-2.5 pr-4 font-bold whitespace-nowrap uppercase", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("py-3.5 pr-4 align-middle", className)}>{children}</td>;
}

/** Stato vuoto: dice cosa manca e come rimediare, non solo "nessun risultato". */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="py-14 text-center">
      <p className="font-display text-lg font-extrabold tracking-tight">{title}</p>
      <p className="text-cacao-soft mx-auto mt-2 max-w-md text-sm leading-relaxed">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="bg-fiamma text-cacao rounded-pill mt-5 inline-flex px-5 py-2.5 text-sm font-semibold"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Nastro per i dati di esempio, così non si confondono con i dati veri. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm leading-relaxed font-medium">
      {children}
    </p>
  );
}
