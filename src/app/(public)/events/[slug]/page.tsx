import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLongDate, formatTimeRange } from "@/lib/format";
import { getEventBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  const description = event.description.slice(0, 180);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.imageUrl ? [event.imageUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <article className="container-page py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/events" className="hover:text-brand">
          Events
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-slate-700">{event.title}</span>
      </nav>

      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          {formatLongDate(event.eventDate)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{event.title}</h1>
      </header>

      {event.imageUrl ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="whitespace-pre-line text-base leading-relaxed text-slate-700">
          {event.description}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-cream p-6">
          <h2 className="text-lg font-semibold text-ink">Event details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-slate-700">Date</dt>
              <dd className="text-slate-600">{formatLongDate(event.eventDate)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Time</dt>
              <dd className="text-slate-600">{formatTimeRange(event.startTime, event.endTime)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Location</dt>
              <dd className="text-slate-600">{event.location}</dd>
            </div>
            {event.organizer ? (
              <div>
                <dt className="font-semibold text-slate-700">Organiser</dt>
                <dd className="text-slate-600">{event.organizer}</dd>
              </div>
            ) : null}
          </dl>

          {event.registrationUrl ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
            >
              Register for this event
            </a>
          ) : (
            <Link
              href="/contact"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
            >
              Ask about this event
            </Link>
          )}
        </aside>
      </div>

      <div className="mt-12">
        <Link href="/events" className="text-sm font-semibold text-brand hover:text-brand-light">
          ← Back to all events
        </Link>
      </div>
    </article>
  );
}
