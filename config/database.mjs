/**
 * Da dove si prende l'indirizzo del database.
 *
 * Vercel non ha più un Postgres suo: si sceglie un fornitore dal Marketplace, e
 * ognuno collega le variabili con un nome diverso. Neon e Prisma Postgres
 * valorizzano `DATABASE_URL`; altri no, e chi ha appena creato il database si
 * ritrova un sito che continua a dire "manca DATABASE_URL" pur avendone uno.
 *
 * Invece di chiedere di ricopiare la stringa a mano, si guardano i nomi
 * conosciuti in ordine di preferenza:
 *
 *  1. `DATABASE_URL` — quello che il progetto documenta, e vince su tutti:
 *     se qualcuno l'ha impostata a mano è una scelta esplicita.
 *  2. `POSTGRES_PRISMA_URL` — pensata proprio per Prisma, con i parametri di
 *     pooling già dentro.
 *  3. `POSTGRES_URL` — la forma generica di parecchie integrazioni.
 *
 * Questo file è in JavaScript e non in TypeScript per un motivo solo: lo legge
 * anche lo script che applica le migrazioni durante il build, che gira su node
 * nudo. Una lista sola, nessuna copia da tenere allineata.
 *
 * @returns {string | undefined}
 */
export function indirizzoDatabase() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    undefined
  );
}

/**
 * Il nome della variabile da cui è stato preso l'indirizzo, per poterlo dire
 * a chi sta configurando il sito.
 *
 * @returns {string | undefined}
 */
export function nomeVariabileDatabase() {
  for (const nome of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) {
    if (process.env[nome]) return nome;
  }
  return undefined;
}
