import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">We could not find that page</h1>
        <p className="mt-3 text-slate-600">
          The page you are looking for may have been moved, or the content is no longer published.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Return home
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Contact the church
          </Link>
        </div>
      </div>
    </main>
  );
}
