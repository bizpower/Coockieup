#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

/**
 * Avvio in un colpo solo, per guardare il sito.
 *
 * Fa quello che il README chiede di fare a mano: procura un PostgreSQL, scrive
 * un .env se non c'è, applica lo schema, popola il catalogo e avvia il sito.
 * Serve a poter vedere l'e-commerce senza prima configurare niente.
 *
 * Non è il percorso di produzione: lì il database è gestito e le variabili le
 * imposta la piattaforma. Questo è solo per la vetrina locale.
 *
 * Regola di questo file: nessun passaggio può morire mostrando uno stack trace.
 * Chi lancia questo comando vuole vedere un sito, non leggere un errore di
 * Node. Ogni cosa che può andare storta si spiega da sola e dice cosa fare.
 */

const CONTAINER = "cookieup-demo-db";
// Porta 5433 e non 5432: se hai già un PostgreSQL tuo, la demo non gli va addosso.
const DEMO_DB_URL = "postgresql://postgres:demo@127.0.0.1:5433/cookieup?schema=public";
const NODE_MINIMO = 20;

// --- utilità ----------------------------------------------------------------

function step(messaggio) {
  console.log(`\n\x1b[1m→ ${messaggio}\x1b[0m`);
}

/** Si ferma spiegando cosa è successo e cosa fare. Mai uno stack trace. */
function fermati(titolo, ...righe) {
  console.error(`\n\x1b[1m\x1b[31m${titolo}\x1b[0m\n`);
  for (const riga of righe) console.error(`  ${riga}`);
  console.error("");
  process.exit(1);
}

/** Esegue mostrando l'output. In caso di errore chiama `fermati` con la spiegazione. */
function esegui(comando, env, spiegazione) {
  try {
    execSync(comando, { stdio: "inherit", env: { ...process.env, ...env } });
  } catch {
    fermati(...spiegazione);
  }
}

/** Esegue in silenzio e restituisce l'output, oppure `null` se fallisce. */
function prova(comando) {
  try {
    return execSync(comando, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const attendi = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// --- 1. Node ----------------------------------------------------------------

const versioneNode = Number(process.versions.node.split(".")[0]);
if (versioneNode < NODE_MINIMO) {
  fermati(
    `Serve Node ${NODE_MINIMO} o superiore. Qui c'è la ${process.versions.node}.`,
    "Next 16 non parte con versioni più vecchie.",
    "Aggiorna da https://nodejs.org (versione LTS) e rilancia questo comando.",
  );
}

// --- 2. Quale database usare ------------------------------------------------

/**
 * Se hai già un PostgreSQL tuo, Docker non serve.
 *
 * Un DATABASE_URL diverso da quello della demo è una scelta esplicita: la si
 * rispetta e si salta tutta la parte del container. Se invece l'indirizzo è
 * quello della demo (o non c'è), il database va procurato, e per quello serve
 * Docker.
 */
function urlDalFileEnv() {
  if (!existsSync(".env")) return null;
  const riga = readFileSync(".env", "utf8")
    .split("\n")
    .find((r) => r.trimStart().startsWith("DATABASE_URL"));
  if (!riga) return null;
  const valore = riga.slice(riga.indexOf("=") + 1).trim();
  return valore.replace(/^["']|["']$/g, "") || null;
}

const urlEsistente = process.env.DATABASE_URL || urlDalFileEnv();
const dbUrl = urlEsistente || DEMO_DB_URL;
const serveDocker = dbUrl === DEMO_DB_URL;
const env = { DATABASE_URL: dbUrl };

if (!serveDocker) {
  step("Database");
  console.log("  uso quello già configurato in DATABASE_URL, salto Docker.");
}

// --- 3. Il database della demo, dentro Docker -------------------------------

if (serveDocker) {
  step("Database");

  if (!prova("docker --version")) {
    fermati(
      "Docker non è installato.",
      "Serve per il database della demo. Due strade:",
      "",
      "  1. installa Docker Desktop da https://docker.com/products/docker-desktop",
      "  2. oppure usa un PostgreSQL tuo: crea un file .env con dentro",
      '     DATABASE_URL="postgresql://utente:password@127.0.0.1:5432/nomedb"',
      "     e rilancia. Questo comando lo userà e non toccherà Docker.",
    );
  }

  // `docker --version` risponde anche a app chiusa: è il binario, non il
  // servizio. Chi ha Docker Desktop installato ma non avviato passerebbe di
  // qui e si schianterebbe più avanti. `docker info` interroga il servizio.
  if (prova("docker info") === null) {
    fermati(
      "Docker è installato ma non è in esecuzione.",
      "Apri Docker Desktop, aspetta che l'icona diventi verde, e rilancia:",
      "",
      "  npm run demo",
      "",
      "In alternativa, per usare un PostgreSQL tuo, crea un .env con dentro",
      '  DATABASE_URL="postgresql://utente:password@127.0.0.1:5432/nomedb"',
    );
  }

  const inEsecuzione = prova(`docker ps --filter name=^/${CONTAINER}$ --format {{.Names}}`);
  const giaCreato = prova(`docker ps -a --filter name=^/${CONTAINER}$ --format {{.Names}}`);

  if (inEsecuzione) {
    console.log("  già in esecuzione.");
  } else if (giaCreato) {
    esegui(`docker start ${CONTAINER}`, env, [
      "Il database della demo non riparte.",
      `Guarda cosa dice:  docker logs ${CONTAINER}`,
      `Oppure ricomincia da zero:  docker rm -f ${CONTAINER} && npm run demo`,
    ]);
  } else {
    esegui(
      `docker run --name ${CONTAINER} -e POSTGRES_PASSWORD=demo -e POSTGRES_DB=cookieup ` +
        `-p 5433:5432 -d postgres:16`,
      env,
      [
        "Non riesco ad avviare il database della demo.",
        "Di solito è la porta 5433 occupata da qualcos'altro.",
        "Per vedere chi la sta usando:  lsof -i :5433   (su Windows: netstat -ano | findstr 5433)",
        "",
        "In alternativa usa un PostgreSQL tuo: crea un .env con dentro",
        '  DATABASE_URL="postgresql://utente:password@127.0.0.1:5432/nomedb"',
      ],
    );
  }

  step("Attendo che il database risponda");
  let pronto = false;
  for (let tentativo = 0; tentativo < 40; tentativo++) {
    if (prova(`docker exec ${CONTAINER} pg_isready -U postgres`)?.includes("accepting")) {
      pronto = true;
      break;
    }
    attendi(1000);
  }
  if (!pronto) {
    fermati(
      "Il database non ha risposto entro quaranta secondi.",
      `Guarda cosa dice:  docker logs ${CONTAINER}`,
      `Oppure ricomincia da zero:  docker rm -f ${CONTAINER} && npm run demo`,
    );
  }
  console.log("  pronto.");
}

// --- 4. Variabili d'ambiente -------------------------------------------------

if (!existsSync(".env")) {
  step("Creo .env");
  writeFileSync(
    ".env",
    [
      `DATABASE_URL="${dbUrl}"`,
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

// --- 5. Schema e contenuti ---------------------------------------------------

step("Preparo lo schema");
esegui("npx prisma migrate deploy", env, [
  "Non riesco ad applicare lo schema al database.",
  `Indirizzo usato:  ${dbUrl}`,
  "Controlla che il database esista e che utente e password siano quelli giusti.",
]);
esegui("npx prisma generate", env, [
  "Non riesco a generare il client del database.",
  "Prova a reinstallare le dipendenze:  rm -rf node_modules && npm install",
]);

step("Popolo catalogo, testi e articoli");
esegui("npx tsx prisma/seed.ts", env, [
  "Non riesco a popolare il database.",
  "Se ci avevi già lavorato, riparti pulito:",
  `  docker rm -f ${CONTAINER} && npm run demo`,
]);

// --- 6. Via ------------------------------------------------------------------

console.log(`
\x1b[1m\x1b[38;5;202m
  Tutto pronto.
\x1b[0m
  Sito              http://localhost:3000
  Amministrazione   http://localhost:3000/admin
                    admin@example.com  /  cambiami-subito

  Il pagamento non è collegato: gli ordini si registrano come da saldare,
  così puoi provare tutto il percorso d'acquisto fino in fondo.
${serveDocker ? `\n  Per fermare il database:  docker stop ${CONTAINER}\n` : ""}`);

const sito = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ...env },
});

sito.on("error", () =>
  fermati(
    "Non riesco ad avviare il sito.",
    "Prova a reinstallare le dipendenze:  rm -rf node_modules && npm install",
  ),
);
