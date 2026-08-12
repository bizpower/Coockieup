import Link from "next/link";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { DataTable, EmptyState, PageHeader, Panel, StatusBadge, Td, Th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { db } from "@/lib/db";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const posts = await db.post.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { focusKeyword: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { category: true, author: true },
  });

  return (
    <>
      <PageHeader
        title="Magazine"
        description="Articoli, bozze e programmazioni."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/admin/blog/categories" variant="outline" size="sm">
              Categorie
            </ButtonLink>
            <ButtonLink href="/admin/blog/new" size="sm">
              Nuovo articolo
            </ButtonLink>
          </div>
        }
      />

      <Panel>
        <div className="mb-5">
          <AdminSearch placeholder="Titolo o parola chiave…" />
        </div>

        {posts.length === 0 ? (
          <EmptyState
            title={q ? "Nessun articolo trovato" : "Il magazine è vuoto"}
            description={
              q
                ? "Prova con un altro titolo o un'altra parola chiave."
                : "Il primo articolo è quello che comincia a portare traffico organico. Le categorie sono già pronte."
            }
            action={q ? undefined : { href: "/admin/blog/new", label: "Scrivi il primo" }}
          />
        ) : (
          <DataTable
            head={
              <>
                <Th>Titolo</Th>
                <Th>Categoria</Th>
                <Th>Stato</Th>
                <Th>Parola chiave</Th>
                <Th>Parole</Th>
                <Th>Aggiornato</Th>
              </>
            }
          >
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-crema/50">
                <Td>
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="hover:text-fiamma font-semibold underline-offset-2 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="text-cacao-soft block text-xs">/{post.slug}</span>
                </Td>
                <Td className="text-cacao-soft">{post.category?.name ?? "—"}</Td>
                <Td>
                  <StatusBadge status={post.status} />
                  {post.status === "SCHEDULED" && post.scheduledFor && (
                    <span className="text-cacao-soft mt-1 block text-xs">
                      {formatDate(post.scheduledFor)}
                    </span>
                  )}
                </Td>
                <Td className="text-cacao-soft">{post.focusKeyword ?? "—"}</Td>
                <Td className="text-cacao-soft tabular-nums">{post.wordCount}</Td>
                <Td className="text-cacao-soft whitespace-nowrap">{formatDate(post.updatedAt)}</Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
