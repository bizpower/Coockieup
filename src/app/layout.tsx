import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/seo/Analytics";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { fontVariables } from "@/config/fonts";
import { BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";
import {
  SITE_DEFAULT_TITLE,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
} from "@/config/site";
import "./globals.css";

/**
 * Layout radice: solo <html> e <body>.
 *
 * La navbar e il footer stanno nel gruppo (site), così l'area amministrativa
 * potrà avere la sua struttura senza ereditare la navigazione del negozio.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: `${BRAND_NAME}: 15 mini cookie proteici in tre gusti. Formato mini, gusto da biscotto vero.`,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    // Il sito resta fuori dall'indice finché il lancio non è pronto: si apre
    // valorizzando NEXT_PUBLIC_ALLOW_INDEXING a "true".
    index: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
    follow: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#FDFBF6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_LANG} className={fontVariables}>
      <body className="min-h-dvh antialiased">
        {/* Primo elemento focalizzabile: chi naviga da tastiera salta il menu. */}
        <a
          href="#contenuto"
          className="bg-fiamma text-cacao rounded-pill sr-only z-[100] px-5 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Vai al contenuto
        </a>
        {children}

        <OrganizationJsonLd />
        <Analytics />

        <span className="sr-only">
          {BRAND_NAME} — {BRAND_TAGLINE}
        </span>
      </body>
    </html>
  );
}
