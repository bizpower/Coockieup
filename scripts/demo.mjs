#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

/**
 * Avvio in un colpo solo, per guardare il sito.
 *
 * Fa quello che il README chiede di fare a mano: tira su un PostgreSQL con
 * Docker, scrive un .env se non c'è, applica lo schema, popola il catalogo e
 * avvia il sito. Serve a poter vedere l'e-commerce senza prima configurare
 * niente.
 *
 * Non è il percorso di produzione: lì il database è gestito e le variabili le
 * imposta la piattaforma. Questo è solo per la vetrina locale.
 */

const CONTAINER = "cookieup-demo-db";
const DB_URL = "postgresql://postgres:demo@127.0.0.1:5433/cookieup?schema=public";

const run = (cmd, opts = {}) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, DATABASE_URL: DB_URL }, ...opts });

const quiet = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};

function step(message) {
  console.log(`\n\x1b[1m→ ${message}\x1b[0m`);
}

// --- 1. Docker ---------------------------------------------------------------

if (!quiet("docker --version")) {
  console.error(
    "\nServe Docker per avviare il database della demo.\n" +
      "In alternativa, usa un PostgreSQL tuo e segui le istruzioni del README.\n",
  );
  process.exit(1);
}

step("Database");

const running = quiet(`docker ps --filter name=^/${CONTAINER}$ --format {{.Names}}`);
const exists = quiet(`docker ps -a --filter name=^/${CONTAINER}$ --format {{.Names}}`);

if (running) {
  console.log("  già in esecuzione.");
} else if (exists) {
  run(`docker start ${CONTAINER}`);
} else {
  // Porta 5433 e non 5432: se hai già un Postgres tuo, la demo non gli va addosso.
  run(
    `docker run --name ${CONTAINER} -e POSTGRES_PASSWORD=demo -e POSTGRES_DB=cookieup ` +
      `-p 5433:5432 -d postgres:16`,
  );
}

step("Attendo che il database risponda");
let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  if (quiet(`docker exec ${CONTAINER} pg_isready -U postgres`).includes("accepting")) {
    ready = true;
    break;
  }
  // Attesa senza `sleep`, che su Windows non c'è.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}
if (!ready) {
  console.error("\nIl database non è partito. Prova: docker logs " + CONTAINER + "\n");
  process.exit(1);
}
console.log("  pronto.");

// --- 2. Variabili d'ambiente -------------------------------------------------

if (!existsSync(".env")) {
  step("Creo .env");
  writeFileSync(
    ".env",
    [
      `DATABASE_URL="${DB_URL}"`,
      'NEXT_PUBLIC_SITE_URL="http://localhost:3000"',
      `AUTH_SECRET="${randomBytes(32).toString("base64")}"`,
      'ADMIN_EMAIL="admin@example.com"',
      'ADMIN_PASSWORD="cambiami-subito"',
      'NEXT_PUBLIC_ALLOW_INDEXING="false"',
      "",
    ].join("\n"),
  );
  console.log("  fatto. Le credenziali admin sono lì dentro.");
} else {
  console.log("\n  .env già presente: lo lascio com'è.");
}

// --- 3. Schema e contenuti ---------------------------------------------------

step("Preparo lo schema");
run("npx prisma migrate deploy");
run("npx prisma generate");

step("Popolo catalogo, testi e articoli");
run("npx tsx prisma/seed.ts");

// --- 4. Via ------------------------------------------------------------------

console.log(`
\x1b[1m\x1b[38;5;202m
  Tutto pronto.
\x1b[0m
  Sito              http://localhost:3000
  Amministrazione   http://localhost:3000/admin
                    admin@example.com  /  cambiami-subito

  Il pagamento non è collegato: gli ordini si registrano come da saldare,
  così puoi provare tutto il percorso d'acquisto fino in fondo.

  Per fermare il database:  docker stop ${CONTAINER}
`);

spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, DATABASE_URL: DB_URL },
});
