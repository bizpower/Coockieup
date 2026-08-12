import type { Allergen, NutritionFact } from "@prisma/client";
import { UnconfirmedBadge } from "@/components/ui/Badge";

/**
 * Tabella nutrizionale e allergeni.
 *
 * Se anche un solo valore non è validato, la tabella si apre con l'avviso.
 * Un badge per riga in fondo a una lista di numeri passa inosservato: qui la
 * cosa che deve arrivare per prima è che questi numeri non sono un'etichetta.
 */
export function NutritionTable({
  facts,
  allergens,
}: {
  facts: NutritionFact[];
  allergens: Allergen[];
}) {
  const anyUnconfirmed = facts.some((fact) => !fact.isConfirmed);
  const basis = facts[0]?.basis ?? "per 100 g";
  const contains = allergens.filter((a) => a.isPresent);
  const traces = allergens.filter((a) => !a.isPresent);

  return (
    <div>
      {anyUnconfirmed && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
          I valori qui sotto sono obiettivi di formulazione, non una dichiarazione
          nutrizionale. Diventano definitivi dopo le analisi di laboratorio sulla ricetta
          finale, e finché non lo sono restano segnalati.
        </p>
      )}

      {facts.length > 0 && (
        <table className="w-full text-left">
          <caption className="text-cacao-soft mb-3 text-left text-sm">
            Valori medi {basis}
          </caption>
          <tbody>
            {facts.map((fact) => (
              <tr key={fact.id} className="border-cacao-line border-b">
                <th scope="row" className="py-3 pr-4 font-medium">
                  {fact.label}
                  {!fact.isConfirmed && <UnconfirmedBadge className="ml-3 align-middle" />}
                </th>
                <td className="py-3 text-right font-semibold tabular-nums">
                  {fact.value}
                  {fact.unit && ` ${fact.unit}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {allergens.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-extrabold tracking-tight">Allergeni</h3>

          {contains.length > 0 && (
            <p className="mt-3 text-[0.9375rem] leading-relaxed">
              <span className="font-semibold">Contiene:</span>{" "}
              {contains.map((a) => a.label).join(", ")}.
            </p>
          )}

          {traces.length > 0 && (
            <p className="text-cacao-soft mt-2 text-[0.9375rem] leading-relaxed">
              <span className="font-semibold">Può contenere tracce di:</span>{" "}
              {traces.map((a) => a.label).join(", ")}.
            </p>
          )}

          {allergens.some((a) => !a.isConfirmed) && (
            <p className="text-cacao-soft mt-4 text-sm leading-relaxed">
              <UnconfirmedBadge className="mr-2 align-middle" />
              L&apos;elenco allergeni definitivo sarà quello riportato in etichetta, dopo
              la chiusura della ricetta e la verifica dello stabilimento di produzione.
              Non dichiariamo assenze finché non possiamo garantirle.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
