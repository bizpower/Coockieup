import "server-only";
import { BRAND_LEGAL, BRAND_NAME, BRAND_SOCIAL } from "@/config/brand";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { isStripeConfigured } from "@/lib/payments";
import { pendingPhotos } from "@/config/images";
import { countStaleOrders } from "./maintenance";

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
    ordersWithoutEmail,
    staleOrders,
  ] = await Promise.all([
    db.nutritionFact.count({ where: { isConfirmed: false } }),
    db.ingredient.count({ where: { isConfirmed: false } }),
    db.allergen.count({ where: { isConfirmed: false } }),
    db.faqItem.count({ where: { isConfirmed: false, isPublished: true } }),
    db.legalPage.count({ where: { needsLegalReview: true } }),
    db.review.count({ where: { isDemo: true } }),
    db.order.count({ where: { isDemo: true } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.order.count({ where: { confirmationEmailSentAt: null, isDemo: false } }),
    countStaleOrders(),
  ]);

  const labelData = unconfirmedNutrition + unconfirmedIngredients + unconfirmedAllergens;
  const photosMissing = pendingPhotos().length;
  const socialPending = pendingSocial();

  return [
    {
      // Il nome è deciso — CookieUp — quindi la riga non chiede più di
      // sceglierlo. Quello che resta aperto sull'identità sono i profili:
      // compaiono nel footer e vengono dichiarati a Google come account
      // ufficiali del brand, quindi finché puntano alla home della
      // piattaforma stiamo dichiarando il falso.
      id: "brand",
      label: "Collegare i profili social",
      detail:
        socialPending.length === 0
          ? `I profili dichiarati come ufficiali di ${BRAND_NAME} portano ai rispettivi account.`
          : `${socialPending.join(", ")}: il link porta alla home della piattaforma, non a un profilo. Si cambia da config/brand.ts.`,
      done: socialPending.length === 0,
      blocking: false,
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
      id: "email",
      label: "Configurare l'invio delle email",
      detail: isEmailConfigured()
        ? `Le conferme d'ordine partono tramite ${process.env.RESEND_API_KEY ? "Resend" : "Brevo"}.`
        : ordersWithoutEmail > 0
          ? `Nessun provider configurato: ${ordersWithoutEmail} ordini sono stati registrati senza email di conferma. Il sito lo dichiara al cliente invece di fingere.`
          : "Nessun provider configurato: gli ordini verranno registrati senza email di conferma, e la pagina di conferma lo dirà al cliente.",
      done: isEmailConfigured(),
      blocking: true,
      href: "/admin/orders",
    },
    {
      id: "cron",
      label: "Attivare la manutenzione notturna",
      detail: process.env.CRON_SECRET
        ? staleOrders > 0
          ? `Configurata. Ci sono ${staleOrders} ordini non pagati oltre la soglia prevista per il loro metodo di pagamento: verranno liberati alla prossima esecuzione.`
          : "Configurata. Le scorte degli ordini abbandonati vengono liberate ogni notte."
        : "CRON_SECRET non impostata: nessuno libera le scorte degli ordini mai pagati. Un checkout abbandonato tiene la merce bloccata a tempo indeterminato.",
      done: Boolean(process.env.CRON_SECRET),
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

/**
 * Quali social sono ancora un segnaposto.
 *
 * Un link è un segnaposto quando porta alla home della piattaforma invece che
 * a un profilo: `https://instagram.com/` non è l'account di nessuno. Si
 * riconosce dal percorso vuoto, senza dover tenere una lista di stringhe da
 * confrontare che si scorderebbe alla prossima piattaforma aggiunta.
 */
/** Le piattaforme che non si scrivono con la sola iniziale maiuscola. */
const SOCIAL_LABELS: Record<string, string> = { tiktok: "TikTok" };

function pendingSocial(): string[] {
  return Object.entries(BRAND_SOCIAL)
    .filter(([, url]) => {
      try {
        return new URL(url).pathname.replace(/\/+$/, "") === "";
      } catch {
        return true; // Un indirizzo che non si riesce nemmeno a leggere è da sistemare.
      }
    })
    .map(([platform]) => SOCIAL_LABELS[platform] ?? platform[0]!.toUpperCase() + platform.slice(1));
}
