#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import {
  indirizzoDatabase,
  nomeVariabileDatabase,
} from "../config/database.mjs";

/**
 * Verifica dell'installazione: dice cosa manca, in ordine.
 *
 * Quando una pagina mostra "Ci siamo rotti noi" il motivo è quasi sempre uno
 * di cinque, e nessuno di questi si vede dalla pagina: variabili d'ambiente
 * assenti, database irraggiungibile, schema mai applicato, catalogo vuoto,
 * nessun utente amministratore. Questo comando li controlla uno a uno e per
 * ognuno stampa il rimedio esatto.
 *
 * Va bene ovunque giri il sito: in locale legge il .env, su un hosting legge
 * le variabili impostate dalla piattaforma. Non modifica niente.
 */

const OK = "\x1b[32m✓\x1b[0m";
const KO = "\x1b[31m✗\x1b[0m";
const DUBBIO = "\x1b[33m•\x1b[0m";

const problemi = [];

function esito(simbolo, titolo, dettaglio, rimedio) {
  console.log(`${simbolo} ${titolo}`);
  if (dettaglio) console.log(`   ${dettaglio}`);
  if (rimedio) {
    console.log(`   \x1b[1mCome si risolve:\x1b[0m ${rimedio}`);
    problemi.push(titolo);
  }
  console.log("");
}

// --- .env --------------------------------------------------------------------

/**
 * Le variabili del file .env non arrivano da sole in un processo node: le
 * carica Next quando parte, non la shell. Qui vanno lette a mano, altrimenti
 * questo comando direbbe "manca DATABASE_URL" a chi ce l'ha eccome.
 */
function caricaEnv() {
  if (!existsSync(".env")) return false;
  for (const riga of readFileSync(".env", "utf8").split("\n")) {
    const pulita = riga.trim();
    if (!pulita || pulita.startsWith("#")) continue;
    const taglio = pulita.indexOf("=");
    if (taglio < 1) continue;
    const chiave = pulita.slice(0, taglio).trim();
    if (process.env[chiave]) continue; // L'ambiente vero ha la precedenza sul file.
    process.env[chiave] = pulita
      .slice(taglio + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return true;
}

/**
 * La riga che spiega davvero il problema.
 *
 * Prisma apre i suoi errori con righe vuote e con "Invalid invocation", che non
 * dicono niente: la causa vera ("Can't reach database server", "password
 * authentication failed") sta più in basso. Si cerca quella, e solo se non c'è
 * si ripiega sulla prima riga piena.
 */
function causaLeggibile(errore) {
  const righe = String(errore instanceof Error ? errore.message : errore)
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const parlante = righe.find((r) =>
    /can't reach|does not exist|authentication|denied|ECONNREFUSED|ENOTFOUND|timed out|P\d{4}/i.test(
      r,
    ),
  );
  return parlante ?? righe[0] ?? "Nessun dettaglio disponibile.";
}

console.log("\n\x1b[1mVerifica dell'installazione\x1b[0m\n");

const conFileEnv = caricaEnv();
esito(
  conFileEnv ? OK : DUBBIO,
  conFileEnv ? "File .env presente" : "Nessun file .env",
  conFileEnv
    ? null
    : "Va bene se le variabili le imposta la piattaforma di hosting. In locale invece serve.",
  conFileEnv
    ? null
    : "In locale: cp .env.example .env  e riempi i valori. Oppure: npm run demo",
);

// --- variabili obbligatorie --------------------------------------------------

// L'indirizzo del database non si cerca per nome: le integrazioni di Vercel lo
// collegano con nomi diversi e vanno bene tutti (vedi config/database.mjs).
const mancanti = ["NEXT_PUBLIC_SITE_URL", "AUTH_SECRET"].filter(
  (nome) => !process.env[nome],
);
if (!indirizzoDatabase()) mancanti.unshift("DATABASE_URL");

esito(
  mancanti.length === 0 ? OK : KO,
  mancanti.length === 0
    ? "Variabili obbligatorie presenti"
    : `Variabili mancanti: ${mancanti.join(", ")}`,
  null,
  mancanti.length === 0
    ? null
    : "Aggiungile al .env (o al pannello dell'hosting) e riavvia il sito.",
);

const segreto = process.env.AUTH_SECRET ?? "";
if (segreto && segreto.length < 32) {
  esito(
    KO,
    "AUTH_SECRET troppo corta",
    `Ne servono almeno 32 caratteri, qui ce ne sono ${segreto.length}.`,
    "Generane una con: openssl rand -base64 32",
  );
} else if (segreto) {
  esito(OK, "AUTH_SECRET valida", null, null);
}

const urlDatabase = indirizzoDatabase();

if (!urlDatabase) {
  console.log(
    "\x1b[1m\x1b[31mSenza indirizzo del database non posso controllarlo. Mi fermo qui.\x1b[0m\n",
  );
  process.exit(1);
}

// --- database ----------------------------------------------------------------

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient({ datasourceUrl: urlDatabase });

try {
  await db.$queryRaw`SELECT 1`;
  // La password non si stampa mai: questo output finisce spesso incollato.
  const indirizzo = urlDatabase.replace(/:\/\/[^@]*@/, "://***@");
  esito(
    OK,
    `Database raggiungibile (da ${nomeVariabileDatabase()})`,
    indirizzo,
    null,
  );
} catch (errore) {
  esito(
    KO,
    "Database irraggiungibile",
    causaLeggibile(errore),
    "In locale: npm run demo (lo avvia da solo). In produzione: controlla che DATABASE_URL sia quella giusta e che l'hosting possa raggiungere il database.",
  );
  await db.$disconnect();
  riepilogo();
}

// --- schema ------------------------------------------------------------------

let schemaApplicato = false;
try {
  await db.product.count();
  schemaApplicato = true;
  esito(OK, "Schema applicato", null, null);
} catch {
  esito(
    KO,
    "Le tabelle non ci sono",
    "Il database risponde ma è vuoto: le migrazioni non sono mai state applicate.",
    "npx prisma migrate deploy",
  );
}

// --- contenuti ---------------------------------------------------------------

if (schemaApplicato) {
  const [prodotti, prodottiAttivi, testi, admin] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.siteSetting.count(),
    db.adminUser.count(),
  ]);

  if (prodotti === 0 || testi === 0) {
    esito(
      KO,
      "Database vuoto",
      "Schema applicato ma nessun contenuto: il sito non ha niente da mostrare.",
      "npm run db:seed",
    );
  } else {
    esito(
      prodottiAttivi > 0 ? OK : DUBBIO,
      `Contenuti presenti: ${prodotti} prodotti (${prodottiAttivi} in vendita), ${testi} blocchi di testo`,
      prodottiAttivi === 0
        ? "Nessun prodotto è attivo: lo shop risulterà vuoto."
        : null,
      prodottiAttivi === 0 ? "Attiva un prodotto da /admin/products." : null,
    );
  }

  esito(
    admin > 0 ? OK : KO,
    admin > 0
      ? `Utenti amministratori: ${admin}`
      : "Nessun utente amministratore",
    null,
    admin > 0
      ? null
      : "npm run db:seed  (crea il primo accesso da ADMIN_EMAIL e ADMIN_PASSWORD)",
  );
}

await db.$disconnect();
riepilogo();

function riepilogo() {
  if (problemi.length === 0) {
    console.log(
      "\x1b[1m\x1b[32mTutto a posto: il sito ha quello che gli serve per partire.\x1b[0m\n",
    );
    process.exit(0);
  }
  console.log(
    `\x1b[1m\x1b[31m${problemi.length} ${problemi.length === 1 ? "cosa" : "cose"} da sistemare:\x1b[0m`,
  );
  for (const p of problemi) console.log(`  · ${p}`);
  console.log("\nRisolvile nell'ordine: la prima spesso spiega le altre.\n");
  process.exit(1);
}
