import Link from "next/link";
import { PageHero } from "@/components/ui";
import { getDashboardCountsForPublic } from "@/lib/public-counts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publications",
  description:
    "Browse church publications: events, announcements, sermons, and the media library — all in one place.",
  alternates: { canonical: "/publications" },
};

export default async function PublicationsPage() {
  const counts = await getDashboardCountsForPublic();

  const categories = [
    {
      href: "/events",
      title: "Events",
      description: "Upcoming and past gatherings, conferences, outreach days, and services.",
      count: counts.events,
      icon: "📅",
    },
    {
      href: "/announcements",
      title: "Announcements",
      description: "Church news, notices, and updates from the pastoral team.",
      count: counts.announcements,
      icon: "📢",
    },
    {
      href: "/sermons",
      title: "Sermons",
      description: "Listen or watch recent messages, searchable by speaker and scripture.",
      count: counts.sermons,
      icon: "🎧",
    },
    {
      href: "/media",
      title: "Media",
      description: "Photos, videos, and livestream recordings from church life.",
      count: counts.media,
      icon: "🖼️",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Publications"
        title="Everything we publish, in one place"
        description="Events, announcements, sermons, and media are published by the church office and updated regularly."
      />

      <section className="container-page py-16">
        <ul className="grid gap-6 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span aria-hidden="true" className="text-3xl">
                  {category.icon}
                </span>
                <h2 className="mt-4 text-xl font-semibold text-ink">{category.title}</h2>
                <p className="mt-2 flex-1 text-sm text-slate-600">{category.description}</p>
                <p className="mt-4 text-sm font-semibold text-brand">
                  {category.count} published {category.count === 1 ? "item" : "items"} →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
