import { db } from "@/lib/db";
import { destinazione } from "@/lib/storage";
import {
  indirizzoDatabase,
  nomeVariabileDatabase,
} from "../../config/database.mjs";

/**
 * Perché il sito non parte: la risposta, calcolata sul posto.
 *
 * Quando una pagina mostra "Ci siamo rotti noi" la causa non è visibile da
 * nessuna parte. Chi ha appena pubblicato il sito non ha un terminale sotto
 * mano né i log della piattaforma: ha solo un browser. Questi controlli girano
 * dentro il sito stesso e vengono mostrati da `/setup`.
 *
 * Regola vincolante: **nessun valore viene mai restituito**, solo presente o
 * assente. La pagina è pubblica finché il sito non è configurato, quindi non
 * può contenere una stringa di connessione, una chiave o un segreto. Sapere
 * che "DATABASE_URL è assente" non aiuta un attaccante più di quanto già non
 * faccia un sito che risponde errore su ogni pagina.
 */

export type Controllo = {
  titolo: string;
  esito: "ok" | "manca" | "avviso";
  dettaglio: string;
  /** Cosa fare, quando c'è qualcosa da fare. */
  rimedio?: string;
};

export async function diagnostica(): Promise<Controllo[]> {
  const controlli: Controllo[] = [];

  // --- variabili d'ambiente --------------------------------------------------

  // L'indirizzo del database non si controlla per nome: le integrazioni del
  // Marketplace di Vercel lo collegano con nomi diversi, e vanno bene tutti.
  const assenti = [
    ["NEXT_PUBLIC_SITE_URL", "il dominio del sito"],
    ["AUTH_SECRET", "la chiave che firma le sessioni admin"],
  ].filter(([nome]) => nome && !process.env[nome]);

  if (!indirizzoDatabase())
    assenti.unshift(["DATABASE_URL", "l'indirizzo del database"]);

  controlli.push({
    titolo: "Variabili d'ambiente",
    esito: assenti.length === 0 ? "ok" : "manca",
    dettaglio:
      assenti.length === 0
        ? "Le tre variabili obbligatorie sono impostate."
        : `Mancano: ${assenti.map(([nome]) => nome).join(", ")}.`,
    rimedio:
      assenti.length === 0
        ? undefined
        : "Su Vercel: Settings → Environment Variables. Aggiungile e rifai il deploy — le variabili nuove non entrano in un deploy già fatto.",
  });

  const segreto = process.env.AUTH_SECRET;
  if (segreto && segreto.length < 32) {
    controlli.push({
      titolo: "AUTH_SECRET troppo corta",
      esito: "manca",
      dettaglio: `Servono almeno 32 caratteri, qui ce ne sono ${segreto.length}. L'accesso all'amministrazione non funzionerà.`,
      rimedio: "Generane una nuova con: openssl rand -base64 32",
    });
  }

  // --- storage delle immagini ------------------------------------------------

  const dove = destinazione();
  controlli.push({
    titolo: "Immagini caricate",
    esito: dove === "non-configurato" ? "manca" : "ok",
    dettaglio:
      dove === "blob"
        ? "Vercel Blob è collegato: le foto caricate dall'amministrazione restano al loro posto."
        : dove === "disco"
          ? "Salvate sul disco locale. Va bene qui; su una piattaforma serverless sparirebbero."
          : "Il sito gira su Vercel senza Blob: il disco è effimero e le immagini caricate sparirebbero al primo rilancio. Il caricamento viene rifiutato invece di perdere i file in silenzio.",
    rimedio:
      dove === "non-configurato"
        ? "Su Vercel: Storage → Create → Blob. La variabile BLOB_READ_WRITE_TOKEN viene collegata da sola, poi serve un nuovo deploy."
        : undefined,
  });

  if (!indirizzoDatabase()) {
    controlli.push({
      titolo: "Database",
      esito: "manca",
      dettaglio:
        "Nessun indirizzo configurato: né DATABASE_URL, né POSTGRES_PRISMA_URL, né POSTGRES_URL.",
      rimedio:
        "Su Vercel: Storage → Create Database, e scegli un fornitore di Postgres dal Marketplace (Neon o Prisma Postgres). La variabile viene collegata da sola. Poi rifai il deploy.",
    });
    return controlli;
  }

  // --- database --------------------------------------------------------------

  try {
    await db.$queryRaw`SELECT 1`;
    controlli.push({
      titolo: "Database",
      esito: "ok",
      dettaglio: `Raggiungibile e risponde. Indirizzo preso da ${nomeVariabileDatabase()}.`,
    });
  } catch {
    controlli.push({
      titolo: "Database",
      esito: "manca",
      dettaglio: `${nomeVariabileDatabase()} è impostata ma il database non risponde: indirizzo sbagliato, credenziali sbagliate, o il server non raggiungibile da qui.`,
      rimedio:
        "Controlla che la stringa sia quella del database di produzione e che accetti connessioni dall'esterno.",
    });
    return controlli;
  }

  // --- schema e contenuti ----------------------------------------------------

  try {
    const [prodotti, attivi, testi, admin] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.siteSetting.count(),
      db.adminUser.count(),
    ]);

    controlli.push({
      titolo: "Struttura del database",
      esito: "ok",
      dettaglio: "Le tabelle ci sono: le migrazioni sono state applicate.",
    });

    const vuoto = prodotti === 0 || testi === 0;
    controlli.push({
      titolo: "Contenuti",
      esito: vuoto ? "manca" : attivi === 0 ? "avviso" : "ok",
      dettaglio: vuoto
        ? "Il database è vuoto: nessun prodotto e nessun testo. Il sito si apre ma non ha niente da mostrare."
        : `${prodotti} prodotti (${attivi} in vendita) e ${testi} blocchi di testo.`,
      rimedio: vuoto
        ? 'Dal tuo computer, una volta sola: DATABASE_URL="...la stringa di produzione..." npm run db:seed'
        : attivi === 0
          ? "Nessun prodotto è attivo: lo shop risulterà vuoto. Si attiva da /admin/products."
          : undefined,
    });

    controlli.push({
      titolo: "Accesso all'amministrazione",
      esito: admin > 0 ? "ok" : "manca",
      dettaglio:
        admin > 0
          ? `${admin} ${admin === 1 ? "utente" : "utenti"} con accesso a /admin.`
          : "Nessun utente amministratore: non si può entrare in /admin.",
      rimedio:
        admin > 0
          ? undefined
          : "Lo crea lo stesso comando dei contenuti (npm run db:seed), da ADMIN_EMAIL e ADMIN_PASSWORD.",
    });
  } catch {
    controlli.push({
      titolo: "Struttura del database",
      esito: "manca",
      dettaglio:
        "Il database risponde ma le tabelle non ci sono: le migrazioni non sono mai state applicate.",
      rimedio:
        "Le applica il comando di build. Rifai il deploy prendendo l'ultimo commit del ramo: se il tuo deploy è più vecchio di questa correzione, il build non le eseguiva ancora.",
    });
  }

  return controlli;
}
