"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Accesso e uscita dall'area amministrativa.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  redirectTo: z.string().optional(),
});

export type LoginState = { status: "idle" | "error"; message?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    redirectTo: formData.get("redirectTo")?.toString(),
  });

  const genericError: LoginState = {
    status: "error",
    // Un solo messaggio per email inesistente e password sbagliata: dire
    // "questa email non esiste" regala a chi prova un elenco di account validi.
    message: "Email o password non corretti.",
  };

  if (!parsed.success) return genericError;

  const user = await db.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    // Confronto comunque contro un hash fittizio: senza, una risposta immediata
    // rivelerebbe che l'email non esiste prima ancora di guardare la password.
    await bcrypt.compare(
      parsed.data.password,
      "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv",
    );
    return genericError;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return genericError;

  await db.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(token);

  // Solo percorsi interni: un "torna a" preso dalla query potrebbe altrimenti
  // spedire chi accede su un dominio esterno.
  const target = parsed.data.redirectTo;
  const safeTarget = target && target.startsWith("/admin") ? target : "/admin";

  redirect(safeTarget);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}

// --- Cambio password ---------------------------------------------------------

const cambioSchema = z
  .object({
    attuale: z.string().min(1, "Serve la password attuale."),
    nuova: z
      .string()
      .min(12, "La nuova password deve avere almeno 12 caratteri.")
      .max(200),
    conferma: z.string(),
  })
  .refine((dati) => dati.nuova === dati.conferma, {
    message: "Le due password nuove non coincidono.",
    path: ["conferma"],
  });

export type CambioPasswordState = { ok?: boolean; message?: string };

/**
 * Cambio della propria password.
 *
 * Mancava, e la sua assenza era il difetto: la prima password la genera il
 * deploy e finisce nel registro del build, dove resta leggibile a chiunque
 * abbia accesso al progetto. Senza un modo per cambiarla, quella stringa
 * restava valida per sempre.
 *
 * Chiede quella attuale anche se la sessione è già valida: senza, bastano
 * pochi secondi davanti a uno schermo lasciato aperto per prendersi l'account.
 */
export async function cambiaPassword(
  _prev: CambioPasswordState,
  formData: FormData,
): Promise<CambioPasswordState> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session)
    return { ok: false, message: "Sessione scaduta. Rientra e riprova." };

  const parsed = cambioSchema.safeParse({
    attuale: formData.get("attuale")?.toString() ?? "",
    nuova: formData.get("nuova")?.toString() ?? "",
    conferma: formData.get("conferma")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const user = await db.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) return { ok: false, message: "Utente non trovato." };

  const valida = await bcrypt.compare(parsed.data.attuale, user.passwordHash);
  if (!valida)
    return { ok: false, message: "La password attuale non è corretta." };

  if (parsed.data.nuova === parsed.data.attuale) {
    return {
      ok: false,
      message: "La nuova password è uguale a quella attuale.",
    };
  }

  await db.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.nuova, 12) },
  });

  return { ok: true, message: "Password aggiornata." };
}
