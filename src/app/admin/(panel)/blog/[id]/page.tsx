import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { PostEditor } from "@/components/admin/PostEditor";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";

/** Formato accettato da <input type="datetime-local">: YYYY-MM-DDTHH:mm. */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories, media] = await Promise.all([
    db.post.findUnique({ where: { id }, include: { tags: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  if (!post) notFound();

  return (
    <>
      <Link
        href="/admin/blog"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Magazine
      </Link>

      <PageHeader
        title={post.title}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={post.status} />
            {post.status === "PUBLISHED" && (
              <Link
                href={`/magazine/${post.slug}`}
                target="_blank"
                className="text-cacao-soft hover:text-fiamma text-sm font-semibold underline-offset-2 hover:underline"
              >
                Vedi sul sito
              </Link>
            )}
          </div>
        }
      />

      <PostEditor
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status,
          scheduledFor: toLocalInput(post.scheduledFor),
          categoryId: post.categoryId ?? "",
          featuredImageId: post.featuredImageId ?? "",
          featuredImageAlt: post.featuredImageAlt ?? "",
          focusKeyword: post.focusKeyword ?? "",
          seoTitle: post.seoTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          canonicalUrl: post.canonicalUrl ?? "",
          ogTitle: post.ogTitle ?? "",
          ogDescription: post.ogDescription ?? "",
          tags: post.tags.map((tag) => tag.name).join(", "),
          contentJson: post.contentJson as JSONContent,
        }}
        categories={categories}
        media={media}
      />
    </>
  );
}
