import type { JSONContent } from "@tiptap/react";

/**
 * Analisi del documento dell'editor.
 *
 * L'articolo è salvato come JSON di TipTap, non come HTML: da una struttura ad
 * albero si può contare, misurare e verificare. Da una stringa HTML si potrebbe
 * solo cercare con espressioni regolari, che è il modo tipico di ottenere un
 * conteggio parole sbagliato.
 *
 * Il modulo non dipende dal server né dal browser: lo usano sia il pannello SEO
 * dell'editor sia il salvataggio lato server, e i due devono contare uguale.
 */

export type HeadingOutline = { level: number; text: string };

export type ContentAnalysis = {
  wordCount: number;
  readingMinutes: number;
  headings: HeadingOutline[];
  internalLinks: string[];
  externalLinks: string[];
  imageCount: number;
  imagesWithoutAlt: number;
  /** Occorrenze della parola chiave nel testo. */
  keywordHits: number;
  keywordInFirstParagraph: boolean;
};

function collectText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(collectText).join(node.type === "paragraph" ? "" : " ");
}

function walk(node: JSONContent, visit: (node: JSONContent) => void) {
  visit(node);
  node.content?.forEach((child) => walk(child, visit));
}

/** 200 parole al minuto: la media di lettura su schermo per un testo divulgativo. */
const WORDS_PER_MINUTE = 200;

export function analyzeContent(doc: JSONContent, focusKeyword?: string | null): ContentAnalysis {
  const headings: HeadingOutline[] = [];
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  let imageCount = 0;
  let imagesWithoutAlt = 0;
  let firstParagraph = "";

  walk(doc, (node) => {
    if (node.type === "heading") {
      headings.push({
        level: Number(node.attrs?.level ?? 2),
        text: collectText(node).trim(),
      });
    }

    if (node.type === "paragraph" && !firstParagraph) {
      const text = collectText(node).trim();
      if (text) firstParagraph = text;
    }

    if (node.type === "image") {
      imageCount++;
      if (!String(node.attrs?.alt ?? "").trim()) imagesWithoutAlt++;
    }

    node.marks?.forEach((mark) => {
      if (mark.type !== "link") return;
      const href = String(mark.attrs?.href ?? "");
      if (!href) return;
      // Relativo o assoluto sul proprio dominio: è un link interno.
      if (href.startsWith("/") || href.startsWith("#")) internalLinks.push(href);
      else externalLinks.push(href);
    });
  });

  const fullText = collectText(doc).replace(/\s+/g, " ").trim();
  const words = fullText ? fullText.split(" ").filter(Boolean) : [];

  const keyword = focusKeyword?.trim().toLowerCase();
  let keywordHits = 0;
  if (keyword) {
    const haystack = fullText.toLowerCase();
    let index = haystack.indexOf(keyword);
    while (index !== -1) {
      keywordHits++;
      index = haystack.indexOf(keyword, index + keyword.length);
    }
  }

  return {
    wordCount: words.length,
    readingMinutes: Math.max(1, Math.round(words.length / WORDS_PER_MINUTE)),
    headings,
    internalLinks,
    externalLinks,
    imageCount,
    imagesWithoutAlt,
    keywordHits,
    keywordInFirstParagraph: Boolean(
      keyword && firstParagraph.toLowerCase().includes(keyword),
    ),
  };
}

/** Estratto automatico quando l'autore non ne scrive uno. */
export function autoExcerpt(doc: JSONContent, maxLength = 160): string {
  let paragraph = "";
  walk(doc, (node) => {
    if (paragraph || node.type !== "paragraph") return;
    const text = collectText(node).trim();
    if (text) paragraph = text;
  });

  if (paragraph.length <= maxLength) return paragraph;
  // Taglia sull'ultimo spazio, non a metà parola.
  return `${paragraph.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}
