import Image from "next/image";
import Link from "next/link";
import { CookieShape } from "@/components/brand/CookieShape";
import { COOKIE_SHAPES } from "@/config/brand";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { postDate, type PostCard } from "@/services/magazine";

/**
 * Scheda di un articolo.
 *
 * Senza immagine di copertina non resta un buco grigio: compare una delle tre
 * forme del brand su fondo colorato, scelta in modo stabile dallo slug così
 * che lo stesso articolo mostri sempre la stessa. Un magazine appena nato ha
 * quasi solo articoli senza foto, e devono comunque sembrare voluti.
 */
export function ArticleCard({
  post,
  featured = false,
}: {
  post: PostCard;
  featured?: boolean;
}) {
  const date = postDate(post);
  const shapeIndex =
    post.slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % COOKIE_SHAPES.length;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col",
        featured && "sm:grid sm:grid-cols-2 sm:items-center sm:gap-10",
      )}
    >
      <div
        className={cn(
          "rounded-card bg-crema relative overflow-hidden",
          featured ? "aspect-[4/3]" : "aspect-[3/2]",
        )}
      >
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImageAlt ?? post.featuredImage.alt}
            fill
            sizes={featured ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 90vw"}
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grain flex h-full items-center justify-center">
            <CookieShape
              shape={COOKIE_SHAPES[shapeIndex]!}
              className={cn(
                "transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-rotate-6",
                featured ? "w-32" : "w-20",
              )}
            />
          </div>
        )}
      </div>

      <div className={cn(!featured && "mt-5")}>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          {post.category && (
            <span
              className="rounded-full px-2.5 py-1 uppercase"
              style={{ backgroundColor: `${post.category.colorHex}1f`, color: post.category.colorHex }}
            >
              {post.category.name}
            </span>
          )}
          <span className="text-cacao-soft">{post.readingMinutes} min di lettura</span>
        </div>

        <h3 className={cn("mt-3 tracking-tight", featured ? "text-display" : "text-xl font-extrabold")}>
          <Link href={`/magazine/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>

        <p
          className={cn(
            "text-cacao-soft mt-2.5 leading-relaxed",
            featured ? "text-lead" : "line-clamp-3 text-[0.9375rem]",
          )}
        >
          {post.excerpt}
        </p>

        {date && (
          <p className="text-cacao-soft mt-4 text-xs">
            <time dateTime={date.toISOString()}>{formatDate(date)}</time>
          </p>
        )}
      </div>
    </article>
  );
}
