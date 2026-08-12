import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { countPublishedPosts, getCategories, getPublishedPosts } from "@/services/magazine";

const PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Magazine",
  description:
    "Food, proteine, benessere e nutrizione, raccontati senza slogan da palestra. Il magazine del brand.",
  alternates: { canonical: "/magazine" },
};

export default async function MagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);

  const [posts, total, categories] = await Promise.all([
    getPublishedPosts({ take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    countPublishedPosts(),
    getCategories(),
  ]);

  // Solo la prima pagina ha un articolo in evidenza: dalla seconda in poi
  // "in evidenza" non vorrebbe dire niente.
  const featured = page === 1 ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <Section>
      <Container>
        <Eyebrow>Magazine</Eyebrow>
        <h1 className="text-display mt-4 max-w-3xl">
          Cose da leggere mentre finisci il box.
        </h1>
        <p className="text-lead text-cacao-soft mt-5 max-w-2xl">
          Food, proteine, allenamento e nutrizione. Scritti da chi mangia, non da chi
          pesa gli alimenti su una bilancia da laboratorio.
        </p>

        <nav aria-label="Categorie del magazine" className="mt-10">
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/magazine/categoria/${category.slug}`}
                  className="border-cacao-line hover:border-cacao inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: category.colorHex }}
                    aria-hidden="true"
                  />
                  {category.name}
                  <span className="text-cacao-soft text-xs">{category._count.posts}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {posts.length === 0 ? (
          <div className="border-cacao-line mt-16 rounded-2xl border border-dashed py-20 text-center">
            <p className="font-display text-2xl font-extrabold tracking-tight">
              Il primo articolo sta arrivando.
            </p>
            <p className="text-cacao-soft mx-auto mt-3 max-w-md leading-relaxed">
              Il magazine è pronto, le categorie anche. Manca solo che qualcuno si metta a
              scrivere — e ci stiamo lavorando.
            </p>
            <Link
              href="/shop"
              className="hover:text-fiamma mt-6 inline-block font-semibold underline underline-offset-4"
            >
              Nel frattempo, il box è già in vendita
            </Link>
          </div>
        ) : (
          <>
            {featured && (
              <div className="border-cacao-line mt-14 border-t pt-14">
                <ArticleCard post={featured} featured />
              </div>
            )}

            {rest.length > 0 && (
              <ul className="border-cacao-line mt-14 grid gap-x-8 gap-y-12 border-t pt-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.id}>
                    <ArticleCard post={post} />
                  </li>
                ))}
              </ul>
            )}

            {lastPage > 1 && (
              <nav
                aria-label="Paginazione del magazine"
                className="border-cacao-line mt-16 flex items-center justify-between gap-4 border-t pt-8"
              >
                {page > 1 ? (
                  <Link
                    href={page === 2 ? "/magazine" : `/magazine?p=${page - 1}`}
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
                  <Link href={`/magazine?p=${page + 1}`} className="font-semibold underline underline-offset-4">
                    Più vecchi →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}
