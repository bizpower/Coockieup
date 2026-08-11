import Link from "next/link";
import { notFound } from "next/navigation";
import { BenefitGrid } from "@/components/marketing/BenefitGrid";
import { BundleTeaser } from "@/components/marketing/BundleTeaser";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FlavorShowcase } from "@/components/marketing/FlavorShowcase";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IngredientSection } from "@/components/marketing/IngredientSection";
import { SocialProof } from "@/components/marketing/SocialProof";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { getFeaturedProduct, getPublishedReviews } from "@/services/catalog";
import { getContent } from "@/services/content";
import { db } from "@/lib/db";

/**
 * Homepage.
 *
 * Ogni sezione è un componente che riceve dati già risolti: nessuna query
 * dentro i componenti di presentazione, nessuna sezione che sa da dove
 * arrivano i suoi contenuti. Il copy viene dal CMS, il catalogo dal database.
 */

export default async function HomePage() {
  const product = await getFeaturedProduct();
  if (!product) notFound();

  const [hero, productSection, benefits, ingredientSection, howItWorks, socialProof, reviews, faqs] =
    await Promise.all([
      getContent("hero"),
      getContent("productSection"),
      getContent("benefits"),
      getContent("ingredientSection"),
      getContent("howItWorks"),
      getContent("socialProof"),
      getPublishedReviews(product.id, 3),
      db.faqItem.findMany({
        where: { isPublished: true, group: "prodotto" },
        orderBy: { sortOrder: "asc" },
        take: 5,
      }),
    ]);

  const highlights = product.nutrition.filter((fact) => fact.isHighlight);

  return (
    <>
      <Hero content={hero} />

      <FlavorShowcase
        flavors={product.flavors}
        content={productSection}
        unitsPerBox={product.unitsPerBox}
      />

      <BenefitGrid content={benefits} highlights={highlights} />

      <BundleTeaser variants={product.variants} productSlug={product.slug} />

      <IngredientSection content={ingredientSection} ingredients={product.ingredients.slice(0, 6)} />

      <HowItWorks content={howItWorks} />

      <SocialProof content={socialProof} reviews={reviews} />

      <Section tone="crema" aria-labelledby="faq-titolo">
        <Container size="narrow">
          <Eyebrow>Domande</Eyebrow>
          <h2 id="faq-titolo" className="text-display mt-4">
            Le cose che ci chiedete.
          </h2>
          <FaqAccordion items={faqs} className="mt-10" />
          <Link
            href="/faq"
            className="hover:text-fiamma mt-8 inline-flex items-center gap-2 font-semibold underline underline-offset-4 transition-colors"
          >
            Tutte le domande
            <ArrowRightIcon />
          </Link>
        </Container>
      </Section>
    </>
  );
}
