import { ContentBlockEditor } from "@/components/admin/CrudForms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { contentRegistryEntries } from "@/services/content.registry";

export default async function AdminContentPage() {
  const entries = contentRegistryEntries();
  const saved = await db.siteSetting.findMany();
  const savedByKey = new Map(saved.map((row) => [row.key, row.valueJson]));

  const groups = [...new Set(entries.map((entry) => entry.group))];

  return (
    <>
      <PageHeader
        title="Testi del sito"
        description="Titoli, sottotitoli e testi delle sezioni. Il salvataggio è immediato: la struttura viene validata prima di essere scritta, quindi un errore di battitura non può rompere la homepage."
      />

      <div className="space-y-6">
        {groups.map((group) => (
          <Panel key={group} title={group === "home" ? "Homepage" : "Generale"}>
            <div className="space-y-8">
              {entries
                .filter((entry) => entry.group === group)
                .map((entry) => (
                  <ContentBlockEditor
                    key={entry.key}
                    contentKey={entry.key}
                    label={entry.label}
                    value={savedByKey.get(entry.key) ?? entry.default}
                  />
                ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
