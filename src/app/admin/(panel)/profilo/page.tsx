import { PasswordForm } from "@/components/admin/PasswordForm";
import { PageHeader, Panel } from "@/components/admin/ui";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminProfiloPage() {
  const session = await getSession();
  const utente = session
    ? await db.adminUser.findUnique({
        where: { id: session.sub },
        select: { email: true, name: true, lastLoginAt: true },
      })
    : null;

  return (
    <>
      <PageHeader
        title="Il tuo accesso"
        description="Email e password con cui entri in quest'area."
      />

      <Panel>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-cacao-soft text-sm">Email</dt>
            <dd className="mt-0.5 font-semibold">{utente?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-cacao-soft text-sm">Ultimo accesso</dt>
            <dd className="mt-0.5 font-semibold">
              {utente?.lastLoginAt
                ? new Intl.DateTimeFormat("it-IT", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(utente.lastLoginAt)
                : "questo"}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel
        className="mt-6"
        title="Cambia password"
        description="La prima password è stata generata dal deploy e resta scritta nel registro del build. Cambiarla è il modo per toglierla di mezzo."
      >
        <PasswordForm />
      </Panel>
    </>
  );
}
