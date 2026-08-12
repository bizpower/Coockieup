import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

/**
 * Cancello dell'area amministrativa.
 *
 * Il controllo sta qui e non nelle singole pagine: una pagina nuova sotto
 * /admin è protetta dal momento in cui viene creata, senza che nessuno debba
 * ricordarsi di aggiungere una guardia. Dimenticarla è il modo tipico in cui
 * un pannello resta aperto per mesi.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Chi ha già una sessione non deve rivedere il modulo di accesso.
  if (pathname === "/admin/login") {
    if (session) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/admin/login", request.url);
    // Dopo l'accesso si torna dove si stava andando, non sempre alla dashboard.
    login.searchParams.set("da", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
