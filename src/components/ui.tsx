import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-slate-600">{description}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: "bg-emerald-100 text-emerald-800",
    DRAFT: "bg-amber-100 text-amber-800",
    NEW: "bg-blue-100 text-blue-800",
    READ: "bg-slate-200 text-slate-700",
    REPLIED: "bg-emerald-100 text-emerald-800",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <Link
        href={buildHref(basePath, params, Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`rounded-md border px-3 py-2 text-sm ${
          page === 1
            ? "pointer-events-none border-slate-200 text-slate-300"
            : "border-slate-300 text-slate-700 hover:border-brand hover:text-brand"
        }`}
      >
        Previous
      </Link>
      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-2">
            {gap ? <span className="px-1 text-slate-400">…</span> : null}
            <Link
              href={buildHref(basePath, params, candidate)}
              aria-current={candidate === page ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm ${
                candidate === page
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 text-slate-700 hover:border-brand hover:text-brand"
              }`}
            >
              {candidate}
            </Link>
          </span>
        );
      })}
      <Link
        href={buildHref(basePath, params, Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`rounded-md border px-3 py-2 text-sm ${
          page === totalPages
            ? "pointer-events-none border-slate-200 text-slate-300"
            : "border-slate-300 text-slate-700 hover:border-brand hover:text-brand"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-ink py-14 text-white sm:py-16">
      <div className="container-page">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-slate-300">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
