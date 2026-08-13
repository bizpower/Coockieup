import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Le immagini caricate dall'amministrazione, quando lo storage è Vercel
      // Blob. Ogni store ha un sottodominio proprio, da cui il jolly: senza
      // questa riga next/image rifiuterebbe di servirle.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["clsx", "tailwind-merge"],
  },
};

export default nextConfig;
