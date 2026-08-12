/**
 * Il confine con l'invio delle email.
 *
 * Regola che vale per tutte le implementazioni: **un provider non configurato
 * non deve mai restituire successo.** Il sito dice al cliente "ti abbiamo
 * scritto" e lo scrive sull'ordine: se quella frase non è vera, l'assistenza
 * si ritrova a cercare un'email che non è mai partita.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  /** Versione testuale. Non è un extra: senza, molti filtri antispam penalizzano. */
  text: string;
  replyTo?: string;
};

export type EmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not-configured" | "failed"; message: string };

export interface EmailProvider {
  readonly id: string;
  readonly label: string;
  send(message: EmailMessage): Promise<EmailResult>;
}
