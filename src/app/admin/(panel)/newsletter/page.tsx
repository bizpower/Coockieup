import { DataTable, EmptyState, PageHeader, Panel, StatCard, StatusBadge, Td, Th } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { db } from "@/lib/db";

export default async function AdminNewsletterPage() {
  const [subscribers, total, consented] = await Promise.all([
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.newsletterSubscriber.count(),
    db.customer.count({ where: { marketingConsent: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Gli iscritti vengono raccolti nel database anche senza provider configurato: nessun contatto va perso in attesa dell'integrazione."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Iscritti dal sito" value={String(total)} tone="brand" />
        <StatCard label="Consensi al checkout" value={String(consented)} />
        <StatCard
          label="Provider"
          value={
            process.env.MAILCHIMP_API_KEY || process.env.BREVO_API_KEY || process.env.KLAVIYO_API_KEY
              ? "Configurato"
              : "Nessuno"
          }
          hint="Vedi README"
          tone="muted"
        />
      </div>

      <div className="mt-6">
        <Panel title="Ultimi iscritti">
          {subscribers.length === 0 ? (
            <EmptyState
              title="Nessun iscritto"
              description="Il modulo è attivo nel footer del sito e nella homepage."
            />
          ) : (
            <DataTable
              head={
                <>
                  <Th>Email</Th>
                  <Th>Nome</Th>
                  <Th>Provenienza</Th>
                  <Th>Data</Th>
                  <Th>Stato</Th>
                </>
              }
            >
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-crema/50">
                  <Td className="font-medium">{subscriber.email}</Td>
                  <Td className="text-cacao-soft">{subscriber.name ?? "—"}</Td>
                  <Td className="text-cacao-soft">{subscriber.source}</Td>
                  <Td className="text-cacao-soft whitespace-nowrap">
                    {formatDate(subscriber.createdAt)}
                  </Td>
                  <Td>
                    <StatusBadge status={subscriber.status} />
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>
    </>
  );
}
