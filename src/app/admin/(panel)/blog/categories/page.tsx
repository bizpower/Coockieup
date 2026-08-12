import Link from "next/link";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <>
      <Link
        href="/admin/blog"
        className="text-cacao-soft hover:text-cacao mb-4 inline-block text-sm font-semibold"
      >
        ← Magazine
      </Link>

      <PageHeader
        title="Categorie"
        description="Ogni categoria ha una sua pagina indicizzabile, con titolo e descrizione propri."
      />

      <Panel>
        <CategoryEditor
          categories={categories.map((category) => ({
            id: category.id,
            slug: category.slug,
            name: category.name,
            description: category.description,
            colorHex: category.colorHex,
            seoTitle: category.seoTitle,
            metaDescription: category.metaDescription,
            postCount: category._count.posts,
          }))}
        />
      </Panel>
    </>
  );
}
