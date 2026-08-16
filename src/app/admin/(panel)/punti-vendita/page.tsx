import { PartnerEditor } from "@/components/admin/CrudForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminPartnersPage() {
  const items = await db.retailPartner.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const unconfirmed = items.filter((item) => !item.isConfirmed).length;

  return (
    <>
      <PageHeader
        title="Punti vendita"
        description="I negozi che rivendono i biscotti. Compaiono in homepage, nella sezione «Dove trovarci»."
      />

      {unconfirmed > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm leading-relaxed font-medium">
          {unconfirmed}{" "}
          {unconfirmed === 1
            ? "scheda non è confermata"
            : "schede non sono confermate"}{" "}
          e quindi {unconfirmed === 1 ? "non compare" : "non compaiono"} sul
          sito. Sono dati di attività altrui: un indirizzo sbagliato manda un
          cliente a vuoto e mette in mezzo un negozio che non ha mai detto
          niente. Spunta «accordo confermato» solo quando l&apos;accordo
          c&apos;è davvero e i dati li hai verificati.
        </p>
      )}

      <Panel>
        <PartnerEditor items={items} />
      </Panel>
    </>
  );
}
