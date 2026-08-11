import { CookieShape } from "@/components/brand/CookieShape";
import { PackShot } from "@/components/brand/PackShot";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/ui/Layout";
import type { ContentValue } from "@/services/content";

/**
 * Hero.
 *
 * Il prodotto occupa metà schermo su desktop e sta sopra la piega su mobile,
 * perché il traffico arriva dai social e la prima cosa da capire è cosa si
 * compra. I tre biscotti orbitano attorno al pack: sono decorativi e nascosti
 * agli screen reader, il pack ha la sua descrizione.
 */

const ORBIT = [
  { shape: "life", className: "left-0 top-8 w-12 -rotate-12 sm:w-16 lg:-left-6 lg:w-24" },
  { shape: "energy", className: "right-0 top-1/3 w-10 rotate-12 sm:w-14 lg:-right-4 lg:w-20" },
  { shape: "potion", className: "bottom-6 left-4 w-11 rotate-6 sm:w-14 lg:bottom-4 lg:w-20" },
] as const;

export function Hero({ content }: { content: ContentValue<"hero"> }) {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28">
      {/* Macchia calda dietro il prodotto: dà profondità senza aggiungere un'immagine. */}
      <div
        aria-hidden="true"
        className="bg-crema pointer-events-none absolute top-[-12%] right-[-18%] h-[34rem] w-[34rem] rounded-full blur-[2px] lg:h-[46rem] lg:w-[46rem]"
      />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div className="order-2 lg:order-1">
            <p className="eyebrow text-fiamma">{content.eyebrow}</p>

            <h1 className="text-hero mt-5">
              {content.headline}
              <br />
              <span className="text-fiamma">{content.headlineAccent}</span>
            </h1>

            <p className="text-lead text-cacao-soft mt-6 max-w-[34rem]">{content.subheadline}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={content.primaryCta.href} size="lg">
                {content.primaryCta.label}
                <ArrowRightIcon />
              </ButtonLink>
              <ButtonLink href={content.secondaryCta.href} size="lg" variant="outline">
                {content.secondaryCta.label}
              </ButtonLink>
            </div>

            <ul className="text-cacao-soft mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
              <li className="flex items-center gap-2">
                <span className="bg-fiamma h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                15 mini cookie a box
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-life h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                3 gusti in ogni confezione
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-energy h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                Spedizione gratis sopra i 39 €
              </li>
            </ul>
          </div>

          {/* Su mobile il pack resta contenuto: a piena larghezza occuperebbe da
              solo tutta la prima schermata e spingerebbe il titolo sotto la piega. */}
          <div className="relative order-1 mx-auto w-full max-w-[14.5rem] sm:max-w-[18rem] lg:order-2 lg:max-w-none">
            <PackShot className="drop-shadow-[0_28px_44px_rgba(36,24,18,0.18)]" />

            {ORBIT.map((item) => (
              <CookieShape
                key={item.shape}
                shape={item.shape}
                className={`absolute ${item.className}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
