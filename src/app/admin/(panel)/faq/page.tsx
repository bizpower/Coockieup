import { FaqEditor } from "@/components/admin/CrudForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminFaqPage() {
  const items = await db.faqItem.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  const unconfirmed = items.filter((item) => !item.isConfirmed).length;

  return (
    <>
      <PageHeader
        title="FAQ"
        description="Le domande compaiono in homepage, nella scheda prodotto e nella pagina dedicata."
      />

      {unconfirmed > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm leading-relaxed font-medium">
          {unconfirmed} risposte non sono confermate e sul sito portano il badge DA CONFERMARE.
          Riguardano ricetta, allergeni e conservazione: restano così finché non ci sono i dati veri.
        </p>
      )}

      <Panel>
        <FaqEditor items={items} />
      </Panel>
    </>
  );
}
