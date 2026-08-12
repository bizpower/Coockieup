import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

/**
 * Sessioni dell'area amministrativa.
 *
 * Un JWT firmato dentro un cookie httpOnly. Niente tabella sessioni: con due
 * o tre redattori il costo di una query per ogni richiesta protetta non
 * comprerebbe nulla, e la revoca immediata non serve — la durata è di otto ore.
 *
 * `jose` funziona anche nel runtime edge, quindi il middleware può verificare
 * la firma senza toccare il database.
 */

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  // Un default silenzioso qui significherebbe un'area amministrativa firmata
  // con una chiave nota, in produzione, senza che nessuno se ne accorga.
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET mancante o troppo corta (servono almeno 32 caratteri). Generane una con: openssl rand -base64 32",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });

    if (typeof payload.email !== "string" || typeof payload.sub !== "string") return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role: payload.role === "ADMIN" ? "ADMIN" : "EDITOR",
    };
  } catch {
    // Firma non valida, token scaduto o manomesso: in tutti i casi non c'è sessione.
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** La sessione corrente, o null. Da usare nei Server Component dell'admin. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
