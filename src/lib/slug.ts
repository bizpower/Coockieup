/**
 * Slug per URL.
 *
 * Le vocali accentate italiane vanno traslitterate, non eliminate: "però"
 * deve diventare "pero", non "per". La normalizzazione NFD separa la lettera
 * dal segno diacritico, e il segno viene poi rimosso.
 *
 * L'intervallo dei diacritici usa le sequenze di escape e non i caratteri
 * veri: quelli sono invisibili in un editor, e un copia-incolla distratto li
 * perderebbe senza che nessuno se ne accorga.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Aggiunge un suffisso numerico finché lo slug non è libero. */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "senza-titolo";

  if (!(await exists(root))) return root;

  for (let n = 2; n < 200; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${root}-${Date.now()}`;
}
