import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Amministrazione", template: "%s · Amministrazione" },
  // L'area amministrativa non deve comparire in nessun indice, mai.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Contenitore dell'area amministrativa.
 *
 * Volutamente vuoto: la barra laterale sta nel gruppo (panel), così la pagina
 * di accesso non eredita una navigazione che non potrebbe usare.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
