import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function AdminMediaPage() {
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });

  const missingAlt = media.filter((item) => !item.alt.trim()).length;

  return (
    <>
      <PageHeader
        title="Media"
        description="Immagini caricate per il magazine e per il sito. Il testo alternativo è obbligatorio: senza, l'immagine è invisibile a chi usa uno screen reader."
      />

      {missingAlt > 0 && (
        <p className="border-warning bg-energy-wash text-cacao mb-6 border-l-4 px-4 py-3 text-sm font-medium">
          {missingAlt} {missingAlt === 1 ? "immagine è" : "immagini sono"} senza testo alternativo.
          Il campo è evidenziato in arancione nella scheda.
        </p>
      )}

      <Panel>
        <MediaLibrary
          items={media.map((item) => ({
            id: item.id,
            filename: item.filename,
            url: item.url,
            alt: item.alt,
            folder: item.folder,
            sizeBytes: item.sizeBytes,
            createdAt: item.createdAt.toISOString(),
            usedInPosts: item._count.posts,
          }))}
        />
      </Panel>
    </>
  );
}
