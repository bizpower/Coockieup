"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const initial: LoginState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
      {pending ? "Verifico…" : "Entra"}
    </Button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action] = useActionState(login, initial);

  return (
    <form action={action}>
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="border-cacao-line bg-panna focus:border-cacao h-12 w-full rounded-xl border-2 px-4 outline-none transition-colors"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border-cacao-line bg-panna focus:border-cacao h-12 w-full rounded-xl border-2 px-4 outline-none transition-colors"
        />
      </div>

      <div aria-live="polite">
        {state.status === "error" && (
          <p className="border-danger bg-fiamma-wash text-danger mt-4 border-l-4 px-4 py-3 text-sm font-semibold">
            {state.message}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
