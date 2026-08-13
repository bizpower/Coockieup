#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  indirizzoDatabase,
  nomeVariabileDatabase,
} from "../config/database.mjs";

/**
 * Applica le migrazioni durante il build.
 *
 * Esiste per una ragione sola: `prisma migrate deploy` legge soltanto
 * `DATABASE_URL`, mentre le integrazioni del Marketplace di Vercel collegano
 * il database con nomi diversi. Senza questo passaggio, chi crea il database
 * da lì vedrebbe il build fallire con "Environment variable not found:
 * DATABASE_URL" pur avendone uno perfettamente funzionante.
 *
 * Qui l'indirizzo si risolve una volta e si passa a prisma come ambiente.
 */

const indirizzo = indirizzoDatabase();

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
  `Database preso da ${nomeVariabileDatabase()}. Applico le migrazioni…`,
);

try {
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: indirizzo },
  });
} catch {
  console.error(`
\x1b[1m\x1b[31mLe migrazioni non sono state applicate.\x1b[0m

  Il database risponde ma lo schema non si è potuto aggiornare. Controlla che
  l'utente della stringa di connessione possa creare tabelle.
`);
  process.exit(1);
}
