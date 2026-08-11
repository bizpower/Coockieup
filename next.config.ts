import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Le immagini del prodotto sono servite da /public finché non si passa a un CDN.
    // Aggiungi qui l'host remoto quando le foto reali sostituiranno gli SVG.
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["clsx", "tailwind-merge"],
  },
};

export default nextConfig;
