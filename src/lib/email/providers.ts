import { BRAND_NAME } from "@/config/brand";
import type { EmailMessage, EmailProvider, EmailResult } from "./types";

/**
 * Provider di posta transazionale.
 *
 * Come per Stripe: chiamate REST con `fetch`, nessun SDK. Sono due POST, e un
 * pacchetto in più significherebbe un pacchetto in più da aggiornare per
 * sempre.
 *
 * Aggiungerne un terzo: una funzione qui e una riga in `index.ts`.
 */

function sender(): string {
  return process.env.EMAIL_FROM ?? "";
}

/**
 * L'endpoint è sovrascrivibile per poter provare l'invio contro un server
 * finto senza spedire posta vera. Non valorizzata, resta quella di Resend.
 */
function resendEndpoint(): string {
  return process.env.RESEND_API_URL ?? "https://api.resend.com/emails";
}

/** https://resend.com/docs/api-reference/emails/send-email */
export const resendProvider: EmailProvider = {
  id: "resend",
  label: "Resend",

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await fetch(resendEndpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${BRAND_NAME} <${sender()}>`,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
      });

      const payload = (await response.json()) as { id?: string; message?: string };

      if (!response.ok) {
        return {
          ok: false,
          reason: "failed",
          message: payload.message ?? `Resend ha risposto ${response.status}.`,
        };
      }

      return { ok: true, id: payload.id ?? null };
    } catch (error) {
      return {
        ok: false,
        reason: "failed",
        message: error instanceof Error ? error.message : "Invio non riuscito.",
      };
    }
  },
};

/** https://developers.brevo.com/reference/sendtransacemail */
export const brevoProvider: EmailProvider = {
  id: "brevo",
  label: "Brevo",

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY ?? "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: BRAND_NAME, email: sender() },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
          ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
        }),
      });

      const payload = (await response.json()) as { messageId?: string; message?: string };

      if (!response.ok) {
        return {
          ok: false,
          reason: "failed",
          message: payload.message ?? `Brevo ha risposto ${response.status}.`,
        };
      }

      return { ok: true, id: payload.messageId ?? null };
    } catch (error) {
      return {
        ok: false,
        reason: "failed",
        message: error instanceof Error ? error.message : "Invio non riuscito.",
      };
    }
  },
};

/**
 * Nessun provider configurato.
 *
 * Scrive nel log del server e restituisce **insuccesso**. È voluto: in
 * sviluppo permette di leggere il contenuto dell'email senza mandarla, e in
 * produzione impedisce che il sito dichiari al cliente un invio mai avvenuto.
 */
export const consoleProvider: EmailProvider = {
  id: "console",
  label: "Nessuno (solo log)",

  async send(message: EmailMessage): Promise<EmailResult> {
    console.info(
      `[email non inviata — nessun provider configurato]\n  a: ${message.to}\n  oggetto: ${message.subject}\n\n${message.text}\n`,
    );

    return {
      ok: false,
      reason: "not-configured",
      message:
        "Nessun provider email configurato: il messaggio è stato solo scritto nel log del server.",
    };
  },
};
