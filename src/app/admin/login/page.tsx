import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ da?: string }>;
}) {
  const { da } = await searchParams;

  return (
    <div className="bg-crema grain flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <p className="text-cacao-soft mt-2 text-sm">Area amministrativa</p>
        </div>

        <div className="bg-panna rounded-card shadow-lift p-7">
          <LoginForm redirectTo={da} />
        </div>

        <p className="text-cacao-soft mt-6 text-center text-xs">
          Accesso riservato. Ogni tentativo viene registrato.
        </p>
      </div>
    </div>
  );
}
