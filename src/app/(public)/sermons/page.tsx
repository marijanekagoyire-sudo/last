import Link from "next/link";
import { SermonCard } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHero, Pagination } from "@/components/ui";
import { getPublicSermons } from "@/lib/queries";
import { sermonCategories } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sermons",
  description:
    "Listen to or watch recent sermons — searchable by title, speaker, and scripture reference.",
  alternates: { canonical: "/sermons" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SermonsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);

  const result = await getPublicSermons({ page, pageSize: 9, search, category });

  return (
    <>
      <PageHero
        eyebrow="Sermons"
        title="Messages from God's Word"
        description="Catch up on recent teaching, or search the archive by speaker, title, or scripture."
      />

      <section className="container-page py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <SearchForm
            action="/sermons"
            placeholder="Search by title, speaker, or scripture"
            defaultValue={search}
            hidden={{ category }}
            label="Search sermons"
          />
          <ul className="flex flex-wrap gap-2">
            {["All", ...sermonCategories].map((item) => {
              const active = (category ?? "All") === item;
              const href =
                item === "All"
                  ? `/sermons${search ? `?search=${encodeURIComponent(search)}` : ""}`
                  : `/sermons?category=${encodeURIComponent(item)}${
                      search ? `&search=${encodeURIComponent(search)}` : ""
                    }`;
              return (
                <li key={item}>
                  <Link
                    href={href}
                    aria-current={active ? "true" : undefined}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-10">
          {result.items.length === 0 ? (
            <EmptyState
              title="No sermons found."
              description={
                search || category
                  ? "Try another search term or category."
                  : "Sermon recordings will appear here once published."
              }
              action={
                search || category ? (
                  <Link
                    href="/sermons"
                    className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
                  >
                    Clear filters
                  </Link>
                ) : null
              }
            />
          ) : (
            <>
              <p className="text-sm text-slate-500">
                {result.total} {result.total === 1 ? "sermon" : "sermons"} available
              </p>
              <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {result.items.map((sermon) => (
                  <li key={sermon.id}>
                    <SermonCard sermon={sermon} />
                  </li>
                ))}
              </ul>
              <Pagination
                basePath="/sermons"
                page={result.page}
                totalPages={result.totalPages}
                params={{ search, category }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
