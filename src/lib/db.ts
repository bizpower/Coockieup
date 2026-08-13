import { PrismaClient } from "@prisma/client";
import { indirizzoDatabase } from "../../config/database.mjs";

/**
 * In sviluppo il hot reload ricrea i moduli a ogni salvataggio: senza questa
 * cache sul global si aprirebbe una connessione nuova ogni volta, fino a
 * esaurire il pool di Postgres.
 *
 * L'indirizzo non si legge direttamente da DATABASE_URL: passa da
 * config/database.mjs, che accetta anche i nomi con cui le integrazioni del
 * Marketplace di Vercel collegano il database. Chi lo crea da lì non deve
 * ricopiare la stringa a mano.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: indirizzoDatabase(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
