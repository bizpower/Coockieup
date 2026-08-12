"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "@/lib/auth";
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

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
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

  const user = await db.adminUser.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    // Confronto comunque contro un hash fittizio: senza, una risposta immediata
    // rivelerebbe che l'email non esiste prima ancora di guardare la password.
    await bcrypt.compare(parsed.data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return genericError;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return genericError;

  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

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
