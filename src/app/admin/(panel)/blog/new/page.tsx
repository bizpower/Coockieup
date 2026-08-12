import Link from "next/link";
import { PostEditor } from "@/components/admin/PostEditor";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminNewPostPage() {
  const [categories, media] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <>
      <Link
        href="/admin/blog"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Magazine
      </Link>

      <PageHeader title="Nuovo articolo" />

      <PostEditor
        post={{
          id: null,
          title: "",
          slug: "",
          excerpt: "",
          status: "DRAFT",
          scheduledFor: "",
          categoryId: "",
          featuredImageId: "",
          featuredImageAlt: "",
          focusKeyword: "",
          seoTitle: "",
          metaDescription: "",
          canonicalUrl: "",
          ogTitle: "",
          ogDescription: "",
          tags: "",
          contentJson: null,
        }}
        categories={categories}
        media={media}
      />
    </>
  );
}
