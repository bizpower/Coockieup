import Link from "next/link";
import { getContent } from "@/services/content";

/**
 * La riga sopra la navbar. Testo e link vengono dal CMS; se la redazione la
 * disattiva, l'elemento non viene proprio renderizzato — niente spazio vuoto.
 */
export async function AnnouncementBar() {
  const announcement = await getContent("announcement");
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const content = (
    <span className="eyebrow block px-5 py-2.5 text-center text-[0.6875rem] sm:text-xs">
      {announcement.text}
    </span>
  );

  return (
    <div className="bg-cacao text-panna">
      {announcement.href ? (
        <Link
          href={announcement.href}
          className="hover:text-fiamma block transition-colors"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
