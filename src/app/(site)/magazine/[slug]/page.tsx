import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { PageViewTracker } from "@/components/seo/PageViewTracker";
import { Container, Section } from "@/components/ui/Layout";
import { SITE_URL } from "@/config/site";
import { formatDate } from "@/lib/format";
import { getContent } from "@/services/content";
import { getPostBySlug, getRelatedPosts, postDate } from "@/services/magazine";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Articolo non trovato" };

  const title = post.seoTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt;
  const published = postDate(post);

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl ?? `/magazine/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
      url: `${SITE_URL}/magazine/${post.slug}`,
      publishedTime: published?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [post.author.name] : undefined,
      images: post.ogImageUrl
        ? [post.ogImageUrl]
        : post.featuredImage
          ? [post.featuredImage.url]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
    },
  };
}

/**
 * Pagina dell'articolo.
 *
 * Il corpo è HTML già sanificato al salvataggio, quindi qui `dangerouslySet`
 * inserisce contenuto che è passato dal filtro sul server. La classe
 * `article-body` in globals.css porta la tipografia editoriale: nessuna
 * dipendenza da un plugin di typography, solo regole scritte per questo brand.
 */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [related, newsletter] = await Promise.all([
    getRelatedPosts(post.id, post.category?.slug),
    getContent("newsletter"),
  ]);

  const published = postDate(post);

  return (
    <>
      <PageViewTracker path={`/magazine/${post.slug}`} />

      <ArticleJsonLd
        title={post.title}
        description={post.metaDescription ?? post.excerpt}
        slug={post.slug}
        publishedAt={published}
        updatedAt={post.updatedAt}
        authorName={post.author?.name}
        imageUrl={post.featuredImage?.url ?? post.ogImageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Magazine", path: "/magazine" },
          ...(post.category
            ? [{ name: post.category.name, path: `/magazine/categoria/${post.category.slug}` }]
            : []),
          { name: post.title, path: `/magazine/${post.slug}` },
        ]}
      />

      <article>
        <Section className="pb-0 sm:pb-0 lg:pb-0">
          <Container size="narrow">
            <nav aria-label="Percorso" className="text-cacao-soft mb-8 text-sm">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/magazine" className="hover:text-fiamma underline-offset-4 hover:underline">
                    Magazine
                  </Link>
                </li>
                {post.category && (
                  <>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link
                        href={`/magazine/categoria/${post.category.slug}`}
                        className="hover:text-fiamma underline-offset-4 hover:underline"
                      >
                        {post.category.name}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            <h1 className="text-display">{post.title}</h1>
            <p className="text-lead text-cacao-soft mt-5">{post.excerpt}</p>

            <div className="text-cacao-soft border-cacao-line mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y py-4 text-sm">
              {post.author && <span className="text-cacao font-semibold">{post.author.name}</span>}
              {published && (
                <time dateTime={published.toISOString()}>{formatDate(published)}</time>
              )}
              <span>{post.readingMinutes} min di lettura</span>
              <span>{post.wordCount} parole</span>
            </div>
          </Container>
        </Section>

        {post.featuredImage && (
          <Section className="py-8 sm:py-10 lg:py-12">
            <Container>
              <div className="rounded-card relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImageAlt ?? post.featuredImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1240px) 1140px, 95vw"
                  className="object-cover"
                />
              </div>
            </Container>
          </Section>
        )}

        <Section className="pt-8 sm:pt-10 lg:pt-12">
          <Container size="narrow">
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {post.tags.length > 0 && (
              <ul className="border-cacao-line mt-14 flex flex-wrap gap-2 border-t pt-8">
                {post.tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/magazine/tag/${tag.slug}`}
                      className="bg-crema hover:bg-crema-deep rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {post.author?.bio && (
              <div className="rounded-card bg-crema grain mt-12 p-6 sm:p-8">
                <p className="text-cacao-soft text-xs font-bold uppercase">Scritto da</p>
                <p className="font-display mt-1 text-xl font-extrabold tracking-tight">
                  {post.author.name}
                </p>
                <p className="text-cacao-soft mt-2 text-[0.9375rem] leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            )}
          </Container>
        </Section>
      </article>

      <Section tone="cacao">
        <Container size="narrow">
          <h2 className="text-title">{newsletter.title}</h2>
          <p className="text-panna/70 mt-3 max-w-xl leading-relaxed">{newsletter.body}</p>
          <div className="mt-7">
            <NewsletterForm
              cta={newsletter.cta}
              consent={newsletter.consent}
              source="magazine"
              inverted
            />
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section aria-labelledby="correlati-titolo">
          <Container>
            <h2 id="correlati-titolo" className="text-title">
              Continua a leggere
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <ArticleCard post={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
