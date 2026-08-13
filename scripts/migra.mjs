#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  indirizzoMigrazioni,
  nomeVariabileMigrazioni,
} from "../config/database.mjs";

/**
 * Applica le migrazioni durante il build.
 *
 * Esiste per due ragioni, e nessuna delle due è aggirabile.
 *
 * La prima: `prisma migrate deploy` legge soltanto `DATABASE_URL`, mentre le
 * integrazioni del Marketplace di Vercel collegano il database con nomi
 * diversi. Senza questo passaggio il build fallirebbe con "Environment
 * variable not found: DATABASE_URL" pur avendo un database funzionante.
 *
 * La seconda: le migrazioni vogliono una connessione **diretta**, non il pool.
 * Neon e Supabase mettono davanti pgbouncer in modalità transazione, che non
 * conserva la sessione fra un comando e l'altro; `migrate deploy` prende un
 * lock consultivo e lo tiene, quindi sul pool si pianta. Qui si sceglie
 * l'indirizzo giusto — vedi config/database.mjs.
 */

const indirizzo = indirizzoMigrazioni();

if (!indirizzo) {
  console.error(`
\x1b[1m\x1b[31mNessun database configurato.\x1b[0m

  Il sito non può funzionare senza. Su Vercel:
  Storage → Create Database → scegli un fornitore di Postgres dal Marketplace
  (Neon o Prisma Postgres vanno bene), poi rifai il deploy.

  Variabili accettate: DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL.
`);
  process.exit(1);
}

console.log(
  `Migrazioni: uso ${nomeVariabileMigrazioni()} (connessione diretta se disponibile).`,
);

try {
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: indirizzo },
  });
} catch {
  console.error(`
\x1b[1m\x1b[31mLe migrazioni non sono state applicate.\x1b[0m

  Due cause possibili, in ordine di probabilità:

  1. L'indirizzo usato passa da un pool di connessioni. Le migrazioni hanno
     bisogno di una connessione diretta. Neon la espone come
     DATABASE_URL_UNPOOLED, altri come POSTGRES_URL_NON_POOLING: se il tuo
     fornitore non ne collega nessuna, imposta DIRECT_URL a mano con la
     stringa "diretta" o "non-pooled" del pannello del database.

  2. L'utente della stringa di connessione non può creare tabelle.
`);
  process.exit(1);
}
