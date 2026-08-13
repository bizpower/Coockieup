/**
 * Da dove si prende l'indirizzo del database.
 *
 * Vercel non ha più un Postgres suo: si sceglie un fornitore dal Marketplace, e
 * ognuno collega le variabili con un nome diverso. Chi crea il database da lì
 * si ritroverebbe un sito che dice "manca DATABASE_URL" pur avendone uno
 * perfettamente funzionante. Invece di chiedere di ricopiare la stringa a
 * mano, si guardano i nomi conosciuti.
 *
 * Ma non c'è un indirizzo solo: ce ne sono due, e servono a cose opposte.
 *
 * **Per il sito** serve quello *con pooling*. Ogni richiesta serverless apre la
 * sua connessione, e un Postgres ne regge poche centinaia: senza un pool in
 * mezzo, un picco di traffico esaurisce le connessioni e il sito cade.
 *
 * **Per le migrazioni** serve quello *diretto*. Un pool in modalità transazione
 * — pgbouncer, che è quello che usano Neon e Supabase — non mantiene la
 * sessione fra un comando e l'altro, e `prisma migrate deploy` ne ha bisogno:
 * prende un lock consultivo e lo tiene per tutta la durata. Sul pool fallisce,
 * e fallisce durante il build, cioè nel momento in cui è più difficile capire
 * cosa sia successo.
 *
 * Le due liste qui sotto tengono conto di questo. È la ragione per cui non
 * basta una variabile sola.
 *
 * Questo file è in JavaScript e non in TypeScript per un motivo solo: lo legge
 * anche lo script che applica le migrazioni durante il build, che gira su node
 * nudo. Una lista sola, nessuna copia da tenere allineata.
 */

/**
 * L'indirizzo che usa il sito. Con pooling, quando c'è.
 *
 * `DATABASE_URL` vince su tutti: se qualcuno l'ha scritta a mano è una scelta
 * esplicita e va rispettata.
 */
const PER_IL_SITO = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];

/**
 * L'indirizzo che usano le migrazioni. Diretto, senza pool.
 *
 * I nomi sono quelli che collegano le integrazioni più diffuse: Neon usa
 * `DATABASE_URL_UNPOOLED`, altre `POSTGRES_URL_NON_POOLING`. `DIRECT_URL` è la
 * convenzione della documentazione di Prisma, ed è quella da impostare a mano
 * se il proprio fornitore non ne collega nessuna.
 */
const PER_LE_MIGRAZIONI = [
  "DIRECT_URL",
  "DIRECT_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

/** @param {string[]} nomi @returns {string | undefined} */
function primoValorizzato(nomi) {
  for (const nome of nomi) {
    if (process.env[nome]) return process.env[nome];
  }
  return undefined;
}

/** @param {string[]} nomi @returns {string | undefined} */
function primoNome(nomi) {
  return nomi.find((nome) => process.env[nome]);
}

/** L'indirizzo con cui il sito interroga il database. @returns {string | undefined} */
export function indirizzoDatabase() {
  return primoValorizzato(PER_IL_SITO);
}

/** Il nome della variabile usata dal sito, per poterlo dire a chi configura. @returns {string | undefined} */
export function nomeVariabileDatabase() {
  return primoNome(PER_IL_SITO);
}

/**
 * L'indirizzo con cui applicare le migrazioni.
 *
 * Se non esiste un indirizzo diretto si ripiega su quello del sito: con un
 * Postgres normale sono la stessa cosa, e su un pool le migrazioni proveranno
 * comunque — meglio un tentativo che un rifiuto a priori.
 *
 * @returns {string | undefined}
 */
export function indirizzoMigrazioni() {
  return primoValorizzato(PER_LE_MIGRAZIONI) ?? indirizzoDatabase();
}

/** @returns {string | undefined} */
export function nomeVariabileMigrazioni() {
  return primoNome(PER_LE_MIGRAZIONI) ?? nomeVariabileDatabase();
}
