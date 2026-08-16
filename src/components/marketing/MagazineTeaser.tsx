import Link from "next/link";
import { ArticleCard } from "@/components/magazine/ArticleCard";
import { Container, Eyebrow, Section } from "@/components/ui/Layout";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { PostCard } from "@/services/magazine";
import type { ContentValue } from "@/services/content";

/**
 * Il rimando al magazine.
 *
 * Come per "Il nostro biscotto", dalla home non ci portava niente: il magazine
 * viveva solo nel menu. Qui si mostrano gli ultimi articoli veri, non tre
 * riquadri finti — se non ce ne sono, la sezione non compare invece di
 * lasciare un buco con scritto "presto".
 */
export function MagazineTeaser({
  content,
  posts,
}: {
  content: ContentValue<"magazineTeaser">;
  posts: PostCard[];
}) {
  if (posts.length === 0) return null;

  return (
    <Section aria-labelledby="magazine-titolo">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 id="magazine-titolo" className="text-display mt-4">
              {content.title}
            </h2>
            <p className="text-lead text-cacao-soft mt-5">{content.body}</p>
          </div>

          <Link
            href="/magazine"
            className="hover:text-fiamma inline-flex items-center gap-2 font-semibold underline underline-offset-4 transition-colors"
          >
            {content.ctaLabel}
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} headingLevel={3} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
