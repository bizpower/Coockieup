import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { db } from "@/lib/db";
import { countPublishedPosts, getPublishedPosts } from "@/services/magazine";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.tag.findUnique({ where: { slug } });
  if (!tag) return { title: "Tag non trovato" };

  return {
    title: `${tag.name} — articoli`,
    description: `Tutti gli articoli del magazine con il tag ${tag.name}.`,
    alternates: { canonical: `/magazine/tag/${tag.slug}` },
    // Le pagine tag hanno spesso contenuto sovrapposto alle categorie:
    // vengono seguite ma non indicizzate, per non competere con sé stesse.
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tag = await db.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const [posts, total] = await Promise.all([
    getPublishedPosts({ tagSlug: slug, take: 24 }),
    countPublishedPosts({ tagSlug: slug }),
  ]);

  return (
    <Section>
      <Container>
        <nav aria-label="Percorso" className="text-cacao-soft mb-8 text-sm">
          <Link href="/magazine" className="hover:text-fiamma underline-offset-4 hover:underline">
            ← Magazine
          </Link>
        </nav>

        <Eyebrow>Tag</Eyebrow>
        <h1 className="text-display mt-4">{tag.name}</h1>
        <p className="text-cacao-soft mt-4 text-sm">
          {total} {total === 1 ? "articolo" : "articoli"}
        </p>

        {posts.length === 0 ? (
          <p className="border-cacao-line text-cacao-soft mt-14 rounded-2xl border border-dashed py-16 text-center">
            Nessun articolo con questo tag.
          </p>
        ) : (
          <ul className="border-cacao-line mt-12 grid gap-x-8 gap-y-12 border-t pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <ArticleCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
