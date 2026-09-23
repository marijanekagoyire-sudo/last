import Link from "next/link";
import { MediaCard } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHero, Pagination } from "@/components/ui";
import { getPublicMedia } from "@/lib/queries";
import { mediaCategories } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Media",
  description:
    "Photos, videos, and livestream recordings from worship services, outreach, conferences, and church activities.",
  alternates: { canonical: "/media" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);

  const result = await getPublicMedia({ page, pageSize: 12, search, category });

  return (
    <>
      <PageHero
        eyebrow="Media"
        title="Moments from church life"
        description="Photos, videos, and livestreams from worship, outreach, conferences, and community activities."
      />

      <section className="container-page py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <SearchForm
            action="/media"
            placeholder="Search the media library"
            defaultValue={search}
            hidden={{ category }}
            label="Search media"
          />
          <ul className="flex flex-wrap gap-2">
            {["All", ...mediaCategories].map((item) => {
              const active = (category ?? "All") === item;
              const href =
                item === "All"
                  ? `/media${search ? `?search=${encodeURIComponent(search)}` : ""}`
                  : `/media?category=${encodeURIComponent(item)}${
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
              title="No media has been published yet."
              description={
                search || category
                  ? "Try another search term or category."
                  : "Photos and videos from church life will appear here."
              }
              action={
                search || category ? (
                  <Link
                    href="/media"
                    className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
                  >
                    Clear filters
                  </Link>
                ) : null
              }
            />
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((item) => (
                  <li key={item.id}>
                    <MediaCard item={item} />
                  </li>
                ))}
              </ul>
              <Pagination
                basePath="/media"
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
