import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Layout";
import { formatDate } from "@/lib/format";
import { db } from "@/lib/db";
import { sanitizeArticleHtml } from "@/lib/sanitize";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.legalPage.findUnique({ where: { slug } });
  if (!page) return { title: "Pagina non trovata" };

  return {
    title: page.title,
    alternates: { canonical: `/legal/${page.slug}` },
    // Una bozza non validata non ha motivo di finire nei risultati di ricerca.
    robots: page.needsLegalReview ? { index: false, follow: true } : undefined,
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.legalPage.findUnique({ where: { slug } });
  if (!page) notFound();

  return (
    <Section>
      <Container size="narrow">
        <h1 className="text-display">{page.title}</h1>
        <p className="text-cacao-soft mt-4 text-sm">
          Ultimo aggiornamento: {formatDate(page.updatedAt)}
        </p>

        {page.needsLegalReview && (
          <p className="border-warning bg-energy-wash text-cacao mt-8 border-l-4 px-5 py-4 text-sm leading-relaxed font-medium">
            <strong>Testo in bozza.</strong> Questa pagina è un segnaposto strutturale, non un
            documento definitivo: deve essere redatta o validata da un consulente legale
            prima dell&apos;apertura degli ordini. La segnaliamo invece di lasciarla passare
            per un testo ufficiale.
          </p>
        )}

        <div
          className="article-body mt-10"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(page.bodyHtml) }}
        />
      </Container>
    </Section>
  );
}
