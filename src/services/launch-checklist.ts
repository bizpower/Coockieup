import "server-only";
import { BRAND_LEGAL, BRAND_NAME } from "@/config/brand";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/payments";
import { pendingPhotos } from "@/config/images";

/**
 * Checklist di lancio, calcolata sui dati veri.
 *
 * Il brief chiedeva "la lista delle cose ancora da configurare prima del
 * lancio". Una lista scritta a mano in un file invecchia il giorno dopo:
 * questa interroga il database e l'ambiente, quindi dice come stanno le cose
 * adesso e si spunta da sola quando il lavoro è fatto.
 */

export type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  /** Un elemento bloccante non dovrebbe restare aperto all'apertura degli ordini. */
  blocking: boolean;
  href?: string;
};

export async function getLaunchChecklist(): Promise<ChecklistItem[]> {
  const [
    unconfirmedNutrition,
    unconfirmedIngredients,
    unconfirmedAllergens,
    unconfirmedFaqs,
    legalPending,
    demoReviews,
    demoOrders,
    activeProducts,
  ] = await Promise.all([
    db.nutritionFact.count({ where: { isConfirmed: false } }),
    db.ingredient.count({ where: { isConfirmed: false } }),
    db.allergen.count({ where: { isConfirmed: false } }),
    db.faqItem.count({ where: { isConfirmed: false, isPublished: true } }),
    db.legalPage.count({ where: { needsLegalReview: true } }),
    db.review.count({ where: { isDemo: true } }),
    db.order.count({ where: { isDemo: true } }),
    db.product.count({ where: { status: "ACTIVE" } }),
  ]);

  const labelData = unconfirmedNutrition + unconfirmedIngredients + unconfirmedAllergens;
  const photosMissing = pendingPhotos().length;

  return [
    {
      id: "brand",
      label: "Scegliere il nome definitivo",
      detail: `Ora è "${BRAND_NAME}", un segnaposto funzionante. Si cambia da config/brand.ts e si aggiorna tutto, packaging disegnato compreso.`,
      done: false,
      blocking: true,
    },
    {
      id: "label",
      label: "Validare i dati di etichetta",
      detail:
        labelData === 0
          ? "Valori nutrizionali, ingredienti e allergeni sono tutti confermati."
          : `${labelData} voci fra valori nutrizionali, ingredienti e allergeni sono ancora obiettivi di formulazione. Sul sito portano il badge DA CONFERMARE.`,
      done: labelData === 0,
      blocking: true,
      href: "/admin/products",
    },
    {
      id: "faq",
      label: "Confermare le risposte delle FAQ",
      detail:
        unconfirmedFaqs === 0
          ? "Tutte le risposte pubblicate sono confermate."
          : `${unconfirmedFaqs} risposte pubblicate non sono confermate.`,
      done: unconfirmedFaqs === 0,
      blocking: true,
      href: "/admin/faq",
    },
    {
      id: "legal",
      label: "Far validare le pagine legali",
      detail:
        legalPending === 0
          ? "Nessuna pagina risulta in attesa di revisione."
          : `${legalPending} pagine su 5 sono ancora segnalate come bozze da sottoporre a un legale.`,
      done: legalPending === 0,
      blocking: true,
      href: "/admin/settings",
    },
    {
      id: "company",
      label: "Inserire i dati societari",
      detail:
        BRAND_LEGAL.companyName.startsWith("[")
          ? "Ragione sociale, partita IVA e sede sono ancora segnaposto in config/brand.ts. Compaiono nel footer di ogni pagina."
          : `Registrati come ${BRAND_LEGAL.companyName}.`,
      done: !BRAND_LEGAL.companyName.startsWith("["),
      blocking: true,
    },
    {
      id: "stripe",
      label: "Configurare i pagamenti",
      detail: isStripeConfigured()
        ? "Stripe è configurato: il checkout incassa con carta."
        : "Senza chiavi Stripe gli ordini nascono da saldare per bonifico. Il checkout funziona, ma non incassa online.",
      done: isStripeConfigured(),
      blocking: true,
    },
    {
      id: "photos",
      label: "Sostituire i disegni con le fotografie",
      detail:
        photosMissing === 0
          ? "Tutte le immagini previste sono fotografie."
          : `${photosMissing} immagini sono ancora disegnate in vettoriale. La lista degli scatti è in docs/PHOTO-BRIEF.md.`,
      done: photosMissing === 0,
      blocking: false,
    },
    {
      id: "demo",
      label: "Eliminare i dati di esempio",
      detail:
        demoReviews + demoOrders === 0
          ? "Nessun contenuto di esempio nel database."
          : `${demoReviews} recensioni e ${demoOrders} ordini di prova sono ancora presenti.`,
      done: demoReviews + demoOrders === 0,
      blocking: true,
      href: "/admin/settings",
    },
    {
      id: "catalog",
      label: "Avere almeno un prodotto attivo",
      detail:
        activeProducts > 0
          ? `${activeProducts} prodotti in vendita.`
          : "Nessun prodotto attivo: lo shop è vuoto.",
      done: activeProducts > 0,
      blocking: true,
      href: "/admin/products",
    },
    {
      id: "indexing",
      label: "Aprire il sito ai motori di ricerca",
      detail:
        process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"
          ? "Il sito è indicizzabile."
          : "Il sito chiede ai motori di non indicizzare. Va portato NEXT_PUBLIC_ALLOW_INDEXING a \"true\" solo al lancio: prima, un'anteprima indicizzata resta nei risultati per settimane.",
      done: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
      blocking: false,
    },
    {
      id: "analytics",
      label: "Collegare gli analytics",
      detail:
        process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
        process.env.NEXT_PUBLIC_META_PIXEL_ID ||
        process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
          ? "Almeno uno strumento di misurazione è configurato."
          : "Nessun ID configurato: gli script non vengono caricati e non viene installato nessun cookie di terze parti.",
      done: Boolean(
        process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
          process.env.NEXT_PUBLIC_META_PIXEL_ID ||
          process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
      ),
      blocking: false,
    },
  ];
}
