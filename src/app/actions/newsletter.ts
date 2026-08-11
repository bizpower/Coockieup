"use server";

import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Iscrizione alla newsletter.
 *
 * L'indirizzo viene salvato in stato PENDING: l'invio del double opt-in e la
 * sincronizzazione con Mailchimp/Brevo/Klaviyo si agganciano qui, dove è
 * segnato il punto di integrazione. Finché il provider non è configurato la
 * lista viene comunque raccolta e non si perde un contatto.
 */

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email("Controlla l'indirizzo email."),
});

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    name: formData.get("name")?.toString(),
    email: formData.get("email")?.toString(),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Controlla i dati inseriti.",
    };
  }

  const { email, name } = parsed.data;
  const source = formData.get("source")?.toString() ?? "footer";

  try {
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { name: name || undefined },
      create: { email, name: name || null, source, status: "PENDING" },
    });
  } catch {
    return {
      status: "error",
      message: "Non siamo riusciti a registrarti. Riprova tra poco.",
    };
  }

  // INTEGRAZIONE: da qui parte la chiamata al provider email (vedi README).

  return {
    status: "success",
    message: "Ci sei. Ti scriviamo solo quando c'è qualcosa da dire.",
  };
}
