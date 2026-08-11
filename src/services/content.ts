import "server-only";
import { db } from "@/lib/db";
import { REGISTRY, type ContentKey, type ContentValue } from "./content.registry";

export type { ContentKey, ContentValue } from "./content.registry";
export { contentRegistryEntries } from "./content.registry";

/**
 * Legge un blocco di copy. Il valore salvato dall'admin vince, ma solo se
 * rispetta lo schema: altrimenti si torna al default e il sito resta in piedi.
 */
export async function getContent<K extends ContentKey>(key: K): Promise<ContentValue<K>> {
  const entry = REGISTRY[key];
  const row = await db.siteSetting.findUnique({ where: { key } });
  if (!row) return entry.default as ContentValue<K>;

  const parsed = entry.schema.safeParse(row.valueJson);
  return (parsed.success ? parsed.data : entry.default) as ContentValue<K>;
}
