import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getSession } from "@/lib/auth";

/**
 * Struttura del pannello.
 *
 * Il middleware ha già respinto chi non ha sessione; qui la si rilegge perché
 * servono nome e ruolo, e perché una guardia in più sul server non costa nulla
 * rispetto al rischio di un pannello raggiungibile per una svista di matcher.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="bg-crema grain min-h-dvh lg:flex">
      <AdminNav userName={session.name} userRole={session.role} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
