import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/lib/auth";
import { church } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (session) redirect("/admin/dashboard");

  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : undefined;

  const notice =
    reason === "expired"
      ? "Your session has expired. Please sign in again."
      : reason === "signed-out"
        ? "You have been signed out."
        : reason === "password-changed"
          ? "Password updated. Please sign in with your new password."
          : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center text-white">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl"
          >
            ✝
          </span>
          <h1 className="mt-4 text-2xl font-semibold">{church.name}</h1>
          <p className="mt-1 text-sm text-slate-400">Administration portal</p>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-xl sm:p-8">
          {notice ? (
            <p
              role="status"
              className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {notice}
            </p>
          ) : null}
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Authorised personnel only. All sign-in attempts are logged.
        </p>
      </div>
    </main>
  );
}
