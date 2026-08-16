import { z } from "zod";

/**
 * COPY DEL SITO — registro unico.
 *
 * Ogni blocco di testo modificabile dalla redazione è dichiarato qui con il suo
 * schema Zod e il suo valore di partenza. Il valore vive nel database
 * (SiteSetting) e questo file resta la fonte della forma: se l'admin salva
 * qualcosa che non rispetta lo schema, il sito ricade sul default invece di
 * rompersi in produzione.
 *
 * Aggiungere un blocco: una voce in REGISTRY. L'admin lo vede comparire da solo.
 *
 * Il modulo è volutamente privo di dipendenze dal server: lo importano sia le
 * pagine sia lo script di seed, che gira fuori da Next.
 */

const announcement = z.object({
  enabled: z.boolean(),
  text: z.string(),
  href: z.string().nullable(),
});

const hero = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  headlineAccent: z.string(),
  subheadline: z.string(),
  primaryCta: z.object({ label: z.string(), href: z.string() }),
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
});

const benefits = z.object({
  eyebrow: z.string(),
  title: z.string(),
  items: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  ),
});

const howItWorks = z.object({
  eyebrow: z.string(),
  title: z.string(),
  steps: z.array(z.object({ label: z.string(), body: z.string() })),
});

const productSection = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
});

const ingredientSection = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  recipeNotice: z.string(),
});

const newsletter = z.object({
  title: z.string(),
  body: z.string(),
  cta: z.string(),
  consent: z.string(),
});

const socialProof = z.object({
  eyebrow: z.string(),
  title: z.string(),
});

/**
 * Le sezioni della home che accompagnano verso una pagina interna.
 *
 * Hanno tutte la stessa forma perché fanno tutte la stessa cosa: dire di cosa
 * parla una pagina e invitare ad aprirla. Un solo schema evita che ognuna
 * inventi campi suoi.
 */
const teaser = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  ctaLabel: z.string(),
});

const retail = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
});

export const REGISTRY = {
  announcement: {
    label: "Barra annunci",
    group: "home",
    schema: announcement,
    default: {
      enabled: true,
      text: "15 mini cookie · 3 gusti · buona fortuna a fermarti a uno",
      href: "/shop",
    },
  },
  hero: {
    label: "Hero — homepage",
    group: "home",
    schema: hero,
    default: {
      eyebrow: "Nuovo · mini protein cookies",
      headline: "Il biscotto proteico",
      headlineAccent: "che non sembra proteico.",
      subheadline:
        "15 mini cookie in tre gusti. Con le proteine dentro e senza quel retrogusto da integratore che conosci benissimo.",
      primaryCta: { label: "Scopri il box", href: "/shop" },
      secondaryCta: { label: "Com'è fatto", href: "/il-nostro-biscotto" },
    },
  },
  productSection: {
    label: "Sezione prodotto — homepage",
    group: "home",
    schema: productSection,
    default: {
      eyebrow: "Il box",
      title: "15 power-up. 3 gusti.",
      body: "Un cuore, un fulmine, un'ampolla. Tre forme che vengono dai power-up dei videogiochi e finiscono in una confezione che sta in borsa, nello zaino e nel cassetto della scrivania.",
    },
  },
  benefits: {
    label: "Perché — benefit card",
    group: "home",
    schema: benefits,
    default: {
      eyebrow: "Perché",
      title: "Quattro motivi, zero prediche.",
      items: [
        {
          key: "proteine",
          title: "Proteine",
          body: "Ci sono, e si sentono nella sazietà più che nel sapore. Quante esattamente lo scriviamo quando il laboratorio ci dà il numero definitivo: non prima.",
        },
        {
          key: "fibre",
          title: "Fibre",
          body: "Dall'avena dell'impasto, non da una polvere aggiunta all'ultimo per far tornare i conti sull'etichetta.",
        },
        {
          key: "mini",
          title: "Mini formato",
          body: "Pochi grammi l'uno. Abbastanza piccoli da mangiarne uno. Abbastanza buoni da non riuscirci.",
        },
        {
          key: "gusto",
          title: "Tanto gusto",
          body: "Il test è uno solo: se non lo rimangeresti senza sapere che è proteico, quella ricetta non esce dal laboratorio.",
        },
      ],
    },
  },
  ingredientSection: {
    label: "Sezione ingredienti",
    group: "home",
    schema: ingredientSection,
    default: {
      eyebrow: "Dentro",
      title: "Roba che sai leggere.",
      body: "La lista completa la trovi in etichetta quando la ricetta è chiusa. Intanto questa è la direzione: pochi ingredienti, riconoscibili, nessun nome che sembri una formula.",
      recipeNotice:
        "Ricetta in sviluppo. Gli ingredienti qui sotto sono la direzione di lavoro, non la formulazione definitiva.",
    },
  },
  howItWorks: {
    label: "Come funziona",
    group: "home",
    schema: howItWorks,
    default: {
      eyebrow: "Come funziona",
      title: "Scegli. Apri. Sgranocchia.",
      steps: [
        {
          label: "Scegli",
          body: "Un box, tre o sei. Più ne prendi, meno paghi — e più tardi ti tocca riordinare.",
        },
        {
          label: "Apri",
          body: "Busta richiudibile. In teoria.",
        },
        {
          label: "Sgranocchia",
          body: "Uno alla volta. Il resto sono affari tuoi.",
        },
      ],
    },
  },
  socialProof: {
    label: "Recensioni — titoli",
    group: "home",
    schema: socialProof,
    default: {
      eyebrow: "Dicono di noi",
      title: "Le prime opinioni.",
    },
  },
  storyTeaser: {
    label: "Rimando — Il nostro biscotto",
    group: "home",
    schema: teaser,
    default: {
      eyebrow: "La storia",
      title: "Perché un cuore, un fulmine e un'ampolla.",
      body: "Nei videogiochi il cuore è una vita in più, il fulmine è la corsa, l'ampolla è quella cosa che ti rimette in piedi. Sono i tre momenti in cui, nella vita vera, apriresti un cassetto a cercare qualcosa da mangiare. Da lì siamo partiti — e da lì è venuto anche il nome.",
      ctaLabel: "Come è fatto il nostro biscotto",
    },
  },
  magazineTeaser: {
    label: "Rimando — Magazine",
    group: "home",
    schema: teaser,
    default: {
      eyebrow: "Magazine",
      title: "Scriviamo anche quando non vendiamo.",
      body: "Proteine, snack, formati, etichette da saper leggere. Articoli veri, senza il tono da integratore e senza promesse che non possiamo mantenere.",
      ctaLabel: "Leggi il magazine",
    },
  },
  retail: {
    label: "Punti vendita — titoli",
    group: "home",
    schema: retail,
    default: {
      eyebrow: "Dove trovarci",
      title: "Non solo qui.",
      body: "Il modo più veloce per assaggiarli è ordinarli. Ma se ti capita di passare da uno di questi posti, sono già lì.",
    },
  },
  newsletter: {
    label: "Newsletter",
    group: "generale",
    schema: newsletter,
    default: {
      title: "Ricevi il prossimo power-up.",
      body: "Ti scriviamo quando esce un gusto nuovo o quando c'è qualcosa da assaggiare in anteprima. Nient'altro.",
      cta: "Iscrivimi",
      consent:
        "Iscrivendoti accetti la nostra Privacy Policy. Ti cancelli con un clic, senza doverci scrivere una lettera.",
    },
  },
} as const;

type Registry = typeof REGISTRY;
export type ContentKey = keyof Registry;
export type ContentValue<K extends ContentKey> = z.infer<Registry[K]["schema"]>;

/** Le voci del registro, per costruire la pagina /admin/content senza duplicare nulla. */
export function contentRegistryEntries() {
  return (Object.keys(REGISTRY) as ContentKey[]).map((key) => ({
    key,
    label: REGISTRY[key].label,
    group: REGISTRY[key].group,
    default: REGISTRY[key].default,
  }));
}
