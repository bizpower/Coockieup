import "server-only";
import { getSession, type SessionPayload } from "./auth";

/**
 * Guardia per le Server Action amministrative.
 *
 * Il middleware protegge le *pagine*, ma una Server Action è un endpoint
 * raggiungibile con una POST diretta, senza aprire nessuna pagina. Ogni azione
 * che scrive deve chiamare questa funzione: è l'unica cosa che sta fra un
 * estraneo e la modifica del catalogo.
 *
 * Solleva invece di restituire un errore: un'azione che dimentica di
 * controllare il risultato fallisce rumorosamente, non silenziosamente.
 */
export async function requireAdmin(minimumRole: "EDITOR" | "ADMIN" = "EDITOR"): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) throw new Error("Sessione amministrativa assente.");

  if (minimumRole === "ADMIN" && session.role !== "ADMIN") {
    throw new Error("Questa operazione richiede il ruolo di amministratore.");
  }

  return session;
}
