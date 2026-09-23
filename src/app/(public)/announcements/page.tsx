import Link from "next/link";
import { AnnouncementCard } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHero, Pagination } from "@/components/ui";
import { getPublicAnnouncements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Announcements",
  description: "Church news, notices, and updates from the pastoral team.",
  alternates: { canonical: "/announcements" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AnnouncementsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);

  const result = await getPublicAnnouncements({ page, pageSize: 8, search });

  return (
    <>
      <PageHero
        eyebrow="Announcements"
        title="Church news and notices"
        description="Stay informed about what is happening across the church family."
      />

      <section className="container-page py-12">
        <SearchForm
          action="/announcements"
          placeholder="Search announcements"
          defaultValue={search}
          label="Search announcements"
        />

        <div className="mt-10">
          {result.items.length === 0 ? (
            <EmptyState
              title="No announcements have been published."
              description={
                search
                  ? "No announcements match your search."
                  : "New notices from the church office will appear here."
              }
              action={
                search ? (
                  <Link
                    href="/announcements"
                    className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
                  >
                    Clear search
                  </Link>
                ) : null
              }
            />
          ) : (
            <>
              <ul className="grid gap-6 md:grid-cols-2">
                {result.items.map((announcement) => (
                  <li key={announcement.id}>
                    <AnnouncementCard announcement={announcement} />
                  </li>
                ))}
              </ul>
              <Pagination
                basePath="/announcements"
                page={result.page}
                totalPages={result.totalPages}
                params={{ search }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
