#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  indirizzoDatabase,
  indirizzoMigrazioni,
  nomeVariabileMigrazioni,
} from "../config/database.mjs";

/**
 * Prepara il database durante il build: schema, e al primo giro i contenuti.
 *
 * ## Perché le migrazioni passano da qui
 *
 * Due ragioni, nessuna aggirabile. La prima: `prisma migrate deploy` legge
 * soltanto `DATABASE_URL`, mentre le integrazioni del Marketplace di Vercel
 * collegano il database con nomi diversi. La seconda: le migrazioni vogliono
 * una connessione **diretta**, non il pool. Neon e Supabase mettono davanti
 * pgbouncer in modalità transazione, che non conserva la sessione fra un
 * comando e l'altro; `migrate deploy` prende un lock consultivo e lo tiene,
 * quindi sul pool si pianta — e si pianta durante il build, cioè nel momento
 * in cui è più difficile capire cosa sia successo.
 *
 * ## Perché anche i contenuti
 *
 * Perché altrimenti resterebbero l'unico passaggio da fare a mano, da un
 * terminale, con il repository clonato e le dipendenze installate: tanto
 * lavoro per una cosa che il sito sa fare da solo. Con questo, pubblicare
 * significa collegare un database e basta.
 *
 * Succede **solo a database vuoto**. Il seed è idempotente, ma rilanciarlo a
 * ogni deploy riscriverebbe i testi modificati dall'amministrazione: chi ha
 * corretto il copy della homepage se lo ritroverebbe come prima al deploy
 * successivo. Quindi si guarda se esiste già qualcosa, e in tal caso non si
 * tocca niente.
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

// --- schema ------------------------------------------------------------------

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

// --- contenuti, solo al primo deploy -----------------------------------------

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient({ datasourceUrl: indirizzoDatabase() });

let vuoto = false;
try {
  const [prodotti, admin] = await Promise.all([
    db.product.count(),
    db.adminUser.count(),
  ]);
  vuoto = prodotti === 0 && admin === 0;
  if (!vuoto) {
    console.log("Database già popolato: non tocco i contenuti.");
  }
} catch (errore) {
  // Non si popola alla cieca: se non si riesce nemmeno a contare, il build
  // prosegue e sarà /setup a dire cosa non va. Lo schema è comunque applicato.
  console.warn(
    "Non riesco a leggere il database per capire se è vuoto, salto i contenuti.",
    errore instanceof Error ? errore.message.split("\n").find(Boolean) : errore,
  );
} finally {
  await db.$disconnect();
}

if (vuoto) {
  // Su un sito pubblico una password predefinita e nota è una porta aperta.
  // Se non ne è stata scelta una, se ne genera una robusta e la si stampa qui:
  // il registro del build lo vede solo chi ha accesso al progetto.
  const passwordGenerata = !process.env.ADMIN_PASSWORD
    ? randomBytes(12).toString("base64url")
    : undefined;

  console.log("Database vuoto: carico catalogo, testi e articoli.");

  try {
    execFileSync("npx", ["tsx", "prisma/seed.ts"], {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: indirizzoDatabase(),
        ...(passwordGenerata ? { ADMIN_PASSWORD: passwordGenerata } : {}),
      },
    });
  } catch {
    // Contenuti mancanti non giustificano un deploy fallito: il sito parte
    // comunque, e /setup dirà che il database è vuoto e come riempirlo.
    console.warn(
      "\x1b[33mI contenuti non sono stati caricati. Il sito parte lo stesso: apri /setup per il dettaglio.\x1b[0m",
    );
  }

  if (passwordGenerata) {
    console.log(`
\x1b[1m\x1b[38;5;202m╭──────────────────────────────────────────────────────────────╮
│  PRIMO ACCESSO ALL'AMMINISTRAZIONE                           │
│  Questa riga compare una volta sola: copiala adesso.         │
╰──────────────────────────────────────────────────────────────╯\x1b[0m

  Indirizzo   /admin
  Email       ${process.env.ADMIN_EMAIL ?? "admin@example.com"}
  Password    ${passwordGenerata}

  Generata a caso perché non avevi impostato ADMIN_PASSWORD: una password
  predefinita e nota, su un sito pubblico, è una porta aperta. Cambiala dopo
  il primo accesso.
`);
  }
}

// --- l'utente amministratore ------------------------------------------------

/**
 * Crea l'accesso indicato in ADMIN_EMAIL, se non esiste.
 *
 * Serve quando il database e' gia' popolato — cioe' sempre, dopo il primo
 * deploy — e occorre un accesso con un indirizzo diverso da quello iniziale.
 * Senza questo, l'unico modo sarebbe una query a mano sul database.
 *
 * Due regole, ed entrambe sono di sicurezza.
 *
 * Un account che esiste **non viene mai toccato**: niente password
 * riscritte a ogni deploy, altrimenti chi cambia la propria dall'interno se la
 * ritroverebbe sostituita al rilascio successivo, e una variabile d'ambiente
 * diventerebbe una scorciatoia permanente per entrare.
 *
 * Se la password non e' indicata ne viene generata una e stampata qui: il
 * registro del build lo legge solo chi ha accesso al progetto, ed e' la stessa
 * porta da cui si impostano le variabili. Chi puo' fare una cosa puo' gia'
 * fare l'altra.
 */
async function assicuraAmministratore() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return;

  const { PrismaClient: Client } = await import("@prisma/client");
  const client = new Client({ datasourceUrl: indirizzoDatabase() });

  try {
    const esistente = await client.adminUser.findUnique({ where: { email } });
    if (esistente) {
      console.log(`Accesso ${email}: gia' presente, non lo tocco.`);
      return;
    }

    const bcrypt = (await import("bcryptjs")).default;
    const password =
      process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");

    await client.adminUser.create({
      data: {
        email,
        name: "Redazione",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    console.log(`
\x1b[1m\x1b[38;5;202m╭──────────────────────────────────────────────────────────────╮
│  NUOVO ACCESSO ALL'AMMINISTRAZIONE                           │
│  Questa riga compare una volta sola: copiala adesso.         │
╰──────────────────────────────────────────────────────────────╯\x1b[0m

  Indirizzo   /admin
  Email       ${email}
  Password    ${password}

  Cambiala dopo il primo accesso da /admin/profilo.
`);
  } catch (errore) {
    // Un accesso non creato non giustifica un deploy fallito: il sito parte
    // comunque e si riprova al rilascio successivo.
    console.warn(
      "Non sono riuscito a preparare l'accesso amministratore:",
      errore instanceof Error
        ? errore.message.split("\n").find(Boolean)
        : errore,
    );
  } finally {
    await client.$disconnect();
  }
}

await assicuraAmministratore();
