import Link from "next/link";
import { EventCard } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHero, Pagination } from "@/components/ui";
import { getPublicEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
  description:
    "Upcoming and past events at our church — services, conferences, outreach days, and community gatherings.",
  alternates: { canonical: "/events" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const scopeParam = firstValue(params.scope);
  const scope = scopeParam === "past" ? "past" : "upcoming";
  const search = firstValue(params.search);
  const page = Math.max(1, Number(firstValue(params.page) ?? 1) || 1);

  const result = await getPublicEvents({ scope, page, pageSize: 9, search });

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Gather with us"
        description="Every event below is published by the church office. Join us — visitors are always welcome."
      />

      <section className="container-page py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-full border border-slate-300 p-1" role="tablist">
            {(
              [
                { key: "upcoming", label: "Upcoming" },
                { key: "past", label: "Past" },
              ] as const
            ).map((tab) => (
              <Link
                key={tab.key}
                href={`/events?scope=${tab.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                role="tab"
                aria-selected={scope === tab.key}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  scope === tab.key ? "bg-brand text-white" : "text-slate-600 hover:text-brand"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <SearchForm
            action="/events"
            placeholder="Search events by title or location"
            defaultValue={search}
            hidden={{ scope }}
            label="Search events"
          />
        </div>

        <div className="mt-10">
          {result.items.length === 0 ? (
            <EmptyState
              title={scope === "upcoming" ? "No upcoming events." : "No past events found."}
              description={
                search
                  ? "Try a different search term or clear the search to see everything."
                  : "Please check back soon — new events are published regularly."
              }
              action={
                search ? (
                  <Link
                    href={`/events?scope=${scope}`}
                    className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
                  >
                    Clear search
                  </Link>
                ) : null
              }
            />
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Showing {result.items.length} of {result.total}{" "}
                {result.total === 1 ? "event" : "events"}
              </p>
              <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {result.items.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
              <Pagination
                basePath="/events"
                page={result.page}
                totalPages={result.totalPages}
                params={{ scope, search }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
