import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * robots.txt.
 *
 * Finché `NEXT_PUBLIC_ALLOW_INDEXING` non vale "true" il sito è chiuso a tutti
 * i crawler. È voluto: un'anteprima indicizzata prima del lancio resta nei
 * risultati per settimane, e nel frattempo mostra prezzi, date e claim che
 * non sono ancora definitivi.
 */
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

  if (!allowIndexing) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nessun valore SEO e, nel caso del carrello, contenuto personale.
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/account",
          "/order-confirmation",
          "/setup",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
