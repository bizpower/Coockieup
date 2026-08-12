import Link from "next/link";
import { CookieShape } from "@/components/brand/CookieShape";
import { LogoLink } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Layout";

/**
 * Pagina 404.
 *
 * Sta alla radice, quindi copre anche le rotte fuori dal gruppo (site) e non
 * dipende dal layout del negozio: una 404 deve funzionare anche quando è il
 * layout stesso a non aver trovato niente da mostrare.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-20 w-full max-w-[1240px] items-center px-5 sm:px-8">
        <LogoLink />
      </header>

      <Section className="flex flex-1 items-center">
        <Container size="narrow" className="text-center">
          <div className="mx-auto w-24 rotate-12">
            <CookieShape shape="potion" />
          </div>

          <p className="eyebrow text-fiamma mt-8">Errore 404</p>
          <h1 className="text-display mt-4">Qui non c&apos;è niente da sgranocchiare.</h1>
          <p className="text-lead text-cacao-soft mt-5">
            La pagina che cercavi non esiste, o non esiste più. Capita.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" size="lg">
              Torna alla home
            </ButtonLink>
            <ButtonLink href="/shop" size="lg" variant="outline">
              Vai allo shop
            </ButtonLink>
          </div>

          <p className="text-cacao-soft mt-10 text-sm">
            Cercavi un ordine?{" "}
            <Link href="/account" className="hover:text-fiamma underline underline-offset-4">
              Lo ritrovi qui
            </Link>
            . Oppure leggi qualcosa sul{" "}
            <Link href="/magazine" className="hover:text-fiamma underline underline-offset-4">
              magazine
            </Link>
            .
          </p>
        </Container>
      </Section>
    </div>
  );
}
