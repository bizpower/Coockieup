"use client";

import { SITE_URL } from "@/config/site";
import type { ContentAnalysis } from "@/lib/editor";
import { cn } from "@/lib/utils";

/**
 * Pannello SEO.
 *
 * Non è un clone di Yoast e non dà un semaforo verde: dà i fatti — quanto è
 * lungo il titolo, quante volte compare la parola chiave, com'è la gerarchia
 * degli heading, quanti link interni ci sono — e lascia decidere a chi scrive.
 * Un punteggio sintetico spinge a inseguire il punteggio invece del lettore.
 *
 * I limiti dichiarati sono quelli oltre cui Google tronca in pagina dei
 * risultati: 60 caratteri circa per il titolo, 155 per la descrizione.
 */

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

function Meter({
  label,
  length,
  limit,
}: {
  label: string;
  length: number;
  limit: number;
}) {
  const over = length > limit;
  const empty = length === 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            empty ? "text-cacao-soft" : over ? "text-danger" : "text-success",
          )}
        >
          {length}/{limit}
        </span>
      </div>
      <div className="bg-crema-deep mt-1.5 h-1 overflow-hidden rounded-full" aria-hidden="true">
        <div
          className={cn("h-full rounded-full", over ? "bg-danger" : "bg-success")}
          style={{ width: `${Math.min(100, (length / limit) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold",
          ok ? "bg-success text-panna" : "bg-crema-deep text-cacao-soft",
        )}
      >
        {ok ? "✓" : "·"}
      </span>
      <span className={cn(!ok && "text-cacao-soft")}>{children}</span>
    </li>
  );
}

export function SeoPanel({
  title,
  seoTitle,
  metaDescription,
  slug,
  focusKeyword,
  analysis,
}: {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  analysis: ContentAnalysis;
}) {
  const effectiveTitle = seoTitle || title;
  const url = `${SITE_URL}/magazine/${slug || "slug-articolo"}`;

  // Un H2 che segue direttamente un H4 salta un livello: per chi naviga con uno
  // screen reader la struttura del testo diventa incomprensibile.
  const headingJumps = analysis.headings.some((heading, index) => {
    if (index === 0) return heading.level > 2;
    const previous = analysis.headings[index - 1]!;
    return heading.level > previous.level + 1;
  });

  const keyword = focusKeyword.trim();

  return (
    <div className="space-y-6">
      {/* Anteprima del risultato di ricerca */}
      <div className="border-cacao-line rounded-xl border p-4">
        <p className="text-cacao-soft mb-2 text-xs font-bold uppercase">Anteprima su Google</p>
        <p className="truncate text-xs text-[#4d5156]">{url}</p>
        <p className="mt-0.5 truncate text-lg text-[#1a0dab]">
          {effectiveTitle || "Titolo dell'articolo"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156]">
          {metaDescription || "La meta description compare qui. Senza, Google ne inventa una."}
        </p>
      </div>

      <div className="space-y-4">
        <Meter label="Titolo SEO" length={effectiveTitle.length} limit={TITLE_LIMIT} />
        <Meter label="Meta description" length={metaDescription.length} limit={DESCRIPTION_LIMIT} />
      </div>

      <div>
        <p className="mb-2.5 text-sm font-bold">Controlli</p>
        <ul className="space-y-2">
          <Check ok={Boolean(keyword)}>
            {keyword ? (
              <>
                Parola chiave: <strong>{keyword}</strong>
              </>
            ) : (
              "Nessuna parola chiave impostata"
            )}
          </Check>

          {keyword && (
            <>
              <Check ok={analysis.keywordHits > 0}>
                Compare {analysis.keywordHits}{" "}
                {analysis.keywordHits === 1 ? "volta" : "volte"} nel testo
              </Check>
              <Check ok={analysis.keywordInFirstParagraph}>Presente nel primo paragrafo</Check>
              <Check ok={effectiveTitle.toLowerCase().includes(keyword.toLowerCase())}>
                Presente nel titolo SEO
              </Check>
              <Check ok={slug.includes(keyword.toLowerCase().replace(/\s+/g, "-"))}>
                Presente nello slug
              </Check>
            </>
          )}

          <Check ok={metaDescription.length > 0}>Meta description scritta</Check>
          <Check ok={analysis.wordCount >= 300}>
            {analysis.wordCount} parole{analysis.wordCount < 300 && " — sotto le 300"}
          </Check>
          <Check ok={analysis.headings.length > 0}>
            {analysis.headings.length} sottotitoli
          </Check>
          <Check ok={!headingJumps}>
            {headingJumps ? "La gerarchia dei sottotitoli salta un livello" : "Gerarchia corretta"}
          </Check>
          <Check ok={analysis.internalLinks.length > 0}>
            {analysis.internalLinks.length} link interni
          </Check>
          <Check ok={analysis.imagesWithoutAlt === 0}>
            {analysis.imagesWithoutAlt === 0
              ? `Tutte le ${analysis.imageCount} immagini hanno il testo alternativo`
              : `${analysis.imagesWithoutAlt} immagini senza testo alternativo`}
          </Check>
        </ul>
      </div>

      {analysis.headings.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">Struttura</p>
          <ul className="space-y-1 text-sm">
            {analysis.headings.map((heading, index) => (
              <li
                key={`${heading.text}-${index}`}
                className="text-cacao-soft truncate"
                style={{ paddingLeft: `${(heading.level - 2) * 14}px` }}
              >
                <span className="text-cacao-soft mr-2 text-xs font-bold">H{heading.level}</span>
                {heading.text || <em>vuoto</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-cacao-line grid grid-cols-3 gap-3 border-t pt-4 text-center">
        <div>
          <p className="font-display text-xl font-extrabold tabular-nums">{analysis.wordCount}</p>
          <p className="text-cacao-soft text-xs">parole</p>
        </div>
        <div>
          <p className="font-display text-xl font-extrabold tabular-nums">
            {analysis.readingMinutes}
          </p>
          <p className="text-cacao-soft text-xs">min di lettura</p>
        </div>
        <div>
          <p className="font-display text-xl font-extrabold tabular-nums">
            {analysis.externalLinks.length}
          </p>
          <p className="text-cacao-soft text-xs">link esterni</p>
        </div>
      </div>
    </div>
  );
}
