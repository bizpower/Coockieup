import { brevoProvider, consoleProvider, resendProvider } from "./providers";
import type { EmailMessage, EmailProvider, EmailResult } from "./types";

export type { EmailMessage, EmailProvider, EmailResult } from "./types";

/**
 * Il provider attivo lo decidono le variabili d'ambiente.
 *
 * Serve sia la chiave sia `EMAIL_FROM`: una chiave valida con un mittente
 * vuoto produce solo rifiuti dal provider, ed è meglio accorgersene guardando
 * la checklist di lancio che leggendo i log dopo il primo ordine vero.
 */
export function getEmailProvider(): EmailProvider {
  const from = process.env.EMAIL_FROM;
  if (!from) return consoleProvider;

  if (process.env.RESEND_API_KEY) return resendProvider;
  if (process.env.BREVO_API_KEY) return brevoProvider;

  return consoleProvider;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider().id !== "console";
}

/**
 * Invia, senza mai sollevare.
 *
 * Un guasto del provider di posta non deve far fallire un ordine già pagato:
 * l'esito torna al chiamante, che lo registra sull'ordine e lo mostra
 * nell'area amministrativa perché qualcuno possa ritentare.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  try {
    return await getEmailProvider().send(message);
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      message: error instanceof Error ? error.message : "Errore imprevisto nell'invio.",
    };
  }
}
