import sanitizeHtml from "sanitize-html";

/**
 * Sanificazione dell'HTML degli articoli.
 *
 * L'HTML viene generato dal JSON di TipTap sul server, quindi in teoria è già
 * sotto controllo. In pratica il documento arriva dal browser di un redattore:
 * chiunque possa scrivere un articolo potrebbe inviare un JSON costruito a
 * mano. Passare comunque dal filtro costa qualche millisecondo al salvataggio
 * e chiude la strada a uno script iniettato in ogni pagina del magazine.
 *
 * Elenco per inclusione, non per esclusione: quello che non è previsto cade,
 * invece di dover ricordare tutto ciò che è pericoloso.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "strong",
      "em",
      "s",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "title", "allow", "allowfullscreen", "width", "height"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    // Niente javascript: né data: negli href e nei src.
    allowedSchemes: ["http", "https", "mailto"],
    // Solo player video conosciuti: un iframe verso un dominio arbitrario è
    // una pagina di terzi dentro la nostra, con tutto quello che comporta.
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
    transformTags: {
      // I link esterni non devono poter manipolare la finestra che li ha aperti.
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: isExternal
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : attribs,
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", alt: attribs.alt ?? "" },
      }),
    },
  });
}
