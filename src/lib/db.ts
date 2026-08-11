import { PrismaClient } from "@prisma/client";

/**
 * In sviluppo il hot reload ricrea i moduli a ogni salvataggio: senza questa
 * cache sul global si aprirebbe una connessione nuova ogni volta, fino a
 * esaurire il pool di Postgres.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
