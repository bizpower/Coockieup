import Link from "next/link";
import { BRAND_LEGAL, BRAND_NAME, BRAND_SOCIAL } from "@/config/brand";
import { FOOTER_NAV } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Container } from "@/components/ui/Layout";
import { getContent } from "@/services/content";

const SOCIALS = [
  { label: "Instagram", href: BRAND_SOCIAL.instagram },
  { label: "TikTok", href: BRAND_SOCIAL.tiktok },
  { label: "Pinterest", href: BRAND_SOCIAL.pinterest },
] as const;

export async function Footer() {
  const newsletter = await getContent("newsletter");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cacao text-panna">
      <Container className="py-16 sm:py-20">
        {/* Newsletter: la cosa più importante del footer sta in cima. */}
        <div className="border-panna/15 grid gap-8 border-b pb-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <h2 className="text-title">{newsletter.title}</h2>
            <p className="text-panna/70 mt-3 max-w-md text-[0.9375rem] leading-relaxed">
              {newsletter.body}
            </p>
          </div>
          <div className="lg:pt-2">
            <NewsletterForm cta={newsletter.cta} consent={newsletter.consent} inverted />
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <Logo size="lg" inverted />
            <p className="text-panna/60 mt-4 max-w-[22rem] text-sm leading-relaxed">
              Mini cookie proteici in tre gusti. Un progetto italiano, ancora in
              costruzione — e si vede, perché lo scriviamo.
            </p>
            <ul className="mt-6 flex gap-4">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="hover:text-fiamma text-sm font-semibold underline-offset-4 transition-colors hover:underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_NAV.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="eyebrow text-panna/50 font-sans">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-panna/85 hover:text-fiamma text-sm underline-offset-4 transition-colors hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-panna/15 text-panna/50 flex flex-col gap-3 border-t pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {BRAND_NAME} — {BRAND_LEGAL.companyName} · P. IVA {BRAND_LEGAL.vatId}
          </p>
          <p>
            Nome, ricetta e dati nutrizionali sono in fase di definizione. Nessun
            valore in etichetta è definitivo.
          </p>
        </div>
      </Container>
    </footer>
  );
}
