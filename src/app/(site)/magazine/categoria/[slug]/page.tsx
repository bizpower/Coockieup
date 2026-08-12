import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { db } from "@/lib/db";
import { countPublishedPosts, getCategories, getPublishedPosts } from "@/services/magazine";

const PER_PAGE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return { title: "Categoria non trovata" };

  return {
    title: category.seoTitle ?? category.name,
    description:
      category.metaDescription ??
      category.description ??
      `Articoli della categoria ${category.name}.`,
    alternates: { canonical: `/magazine/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const [{ slug }, { p }] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(p) || 1);

  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [posts, total, categories] = await Promise.all([
    getPublishedPosts({ categorySlug: slug, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    countPublishedPosts({ categorySlug: slug }),
    getCategories(),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <Section>
      <Container>
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: "Magazine", path: "/magazine" },
            { name: category.name, path: `/magazine/categoria/${category.slug}` },
          ]}
        />

        <nav aria-label="Percorso" className="text-cacao-soft mb-8 text-sm">
          <Link href="/magazine" className="hover:text-fiamma underline-offset-4 hover:underline">
            ← Magazine
          </Link>
        </nav>

        <Eyebrow style={{ color: category.colorHex }}>Categoria</Eyebrow>
        <h1 className="text-display mt-4">{category.name}</h1>
        {category.description && (
          <p className="text-lead text-cacao-soft mt-5 max-w-2xl">{category.description}</p>
        )}
        <p className="text-cacao-soft mt-4 text-sm">
          {total} {total === 1 ? "articolo" : "articoli"}
        </p>

        <nav aria-label="Altre categorie" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {categories
              .filter((item) => item.slug !== slug)
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/magazine/categoria/${item.slug}`}
                    className="border-cacao-line hover:border-cacao inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.colorHex }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        {posts.length === 0 ? (
          <p className="border-cacao-line text-cacao-soft mt-14 rounded-2xl border border-dashed py-16 text-center">
            Ancora nessun articolo in questa categoria.
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

        {lastPage > 1 && (
          <nav
            aria-label="Paginazione"
            className="border-cacao-line mt-14 flex items-center justify-between gap-4 border-t pt-8"
          >
            {page > 1 ? (
              <Link
                href={
                  page === 2
                    ? `/magazine/categoria/${slug}`
                    : `/magazine/categoria/${slug}?p=${page - 1}`
                }
                className="font-semibold underline underline-offset-4"
              >
                ← Più recenti
              </Link>
            ) : (
              <span />
            )}
            <span className="text-cacao-soft text-sm">
              Pagina {page} di {lastPage}
            </span>
            {page < lastPage ? (
              <Link
                href={`/magazine/categoria/${slug}?p=${page + 1}`}
                className="font-semibold underline underline-offset-4"
              >
                Più vecchi →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </Container>
    </Section>
  );
}
