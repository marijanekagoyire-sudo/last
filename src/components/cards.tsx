import Link from "next/link";
import type {
  AnnouncementRecord,
  EventRecord,
  MediaRecord,
  SermonRecord,
} from "@/db/schema";
import { formatDate, formatTimeRange } from "@/lib/format";
import { excerptFromHtml } from "@/lib/sanitize";

const FALLBACK_IMAGE = "/images/hero-worship.jpg";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl ?? FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          width={600}
          height={338}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
          {formatDate(event.eventDate)}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-ink">
          <Link href={`/events/${event.slug}`} className="hover:text-brand">
            {event.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{event.description}</p>
        <dl className="mt-4 space-y-1 text-sm text-slate-500">
          <div className="flex gap-2">
            <dt className="sr-only">Time</dt>
            <dd>🕘 {formatTimeRange(event.startTime, event.endTime)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Location</dt>
            <dd>📍 {event.location}</dd>
          </div>
        </dl>
        <Link
          href={`/events/${event.slug}`}
          className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-light"
        >
          View event details →
        </Link>
      </div>
    </article>
  );
}

export function AnnouncementCard({ announcement }: { announcement: AnnouncementRecord }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold">
        {formatDate(announcement.publishedAt ?? announcement.createdAt)}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">
        <Link href={`/announcements/${announcement.slug}`} className="hover:text-brand">
          {announcement.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">
        {excerptFromHtml(announcement.content, 190)}
      </p>
      <Link
        href={`/announcements/${announcement.slug}`}
        className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-light"
      >
        Read announcement →
      </Link>
    </article>
  );
}

export function SermonCard({ sermon }: { sermon: SermonRecord }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sermon.thumbnailUrl ?? FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          width={600}
          height={338}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
          <span>{formatDate(sermon.sermonDate)}</span>
          <span aria-hidden="true">•</span>
          <span>{sermon.category}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-ink">
          <Link href={`/sermons/${sermon.slug}`} className="hover:text-brand">
            {sermon.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {sermon.speaker}
          {sermon.scripture ? ` · ${sermon.scripture}` : ""}
        </p>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{sermon.description}</p>
        <Link
          href={`/sermons/${sermon.slug}`}
          className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-light"
        >
          Listen or watch →
        </Link>
      </div>
    </article>
  );
}

export function MediaCard({ item }: { item: MediaRecord }) {
  const isPhoto = item.mediaType === "PHOTO";
  return (
    <figure className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl ?? (isPhoto ? item.mediaUrl : FALLBACK_IMAGE)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          width={600}
          height={450}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <figcaption className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-brand">
            {item.category}
          </span>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {item.mediaType.toLowerCase()}
          </span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>
        ) : null}
        <a
          href={item.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-brand hover:text-brand-light"
        >
          {isPhoto ? "View full image" : "Open media"} →
        </a>
      </figcaption>
    </figure>
  );
}
