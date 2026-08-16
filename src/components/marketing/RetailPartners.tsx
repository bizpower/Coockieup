import type { RetailPartner } from "@prisma/client";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { CookieShape } from "@/components/brand/CookieShape";
import { COOKIE_SHAPES } from "@/config/brand";

/**
 * I posti in cui i biscotti si trovano già.
 *
 * Le schede sono attività di terzi. Il sito mostra solo quelle **confermate**:
 * dichiarare che un negozio ci vende senza esserne certi fa un danno doppio —
 * a chi ci va e non trova niente, e al negozio che si ritrova a spiegare una
 * cosa che non ha mai detto. Il filtro sta nella query che passa i dati, e
 * qui si dà per scontato che sia già stato applicato.
 *
 * Se non c'è nessun punto vendita confermato la sezione non compare: una
 * vetrina vuota con scritto "presto disponibile" vale meno di niente.
 */
export function RetailPartners({
  content,
  partners,
}: {
  content: { eyebrow: string; title: string; body: string };
  partners: RetailPartner[];
}) {
  if (partners.length === 0) return null;

  return (
    <Section tone="cacao" aria-labelledby="punti-vendita-titolo">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2
            id="punti-vendita-titolo"
            className="text-display text-panna mt-4"
          >
            {content.title}
          </h2>
          <p className="text-lead text-panna/70 mt-5">{content.body}</p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner, indice) => (
            <li
              key={partner.id}
              className="border-panna/15 hover:border-fiamma/60 rounded-card border p-6 transition-colors"
            >
              {/* Una forma diversa per scheda: le tre del brand a rotazione,
                  così l'elenco non è una fila di riquadri identici. */}
              <CookieShape
                shape={COOKIE_SHAPES[indice % COOKIE_SHAPES.length]!}
                className="w-10 opacity-80"
              />

              <h3 className="font-display text-panna mt-5 text-xl font-bold tracking-tight">
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-fiamma underline-offset-4 hover:underline"
                  >
                    {partner.name}
                  </a>
                ) : (
                  partner.name
                )}
              </h3>

              <p className="text-panna/60 mt-1 text-sm">
                {partner.address
                  ? `${partner.address} · ${partner.city}`
                  : partner.city}
              </p>

              {partner.note && (
                <p className="text-panna/70 mt-4 text-sm">{partner.note}</p>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
