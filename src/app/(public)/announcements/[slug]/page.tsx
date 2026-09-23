import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLongDate } from "@/lib/format";
import { getAnnouncementBySlug } from "@/lib/queries";
import { excerptFromHtml, sanitizeRichText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const announcement = await getAnnouncementBySlug(slug);
  if (!announcement) return { title: "Announcement not found" };

  const description = excerptFromHtml(announcement.content, 180);
  return {
    title: announcement.title,
    description,
    alternates: { canonical: `/announcements/${announcement.slug}` },
    openGraph: {
      title: announcement.title,
      description,
      type: "article",
      images: announcement.imageUrl ? [announcement.imageUrl] : undefined,
    },
  };
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const announcement = await getAnnouncementBySlug(slug);
  if (!announcement) notFound();

  // Content is sanitised on write and again on render (defence in depth).
  const safeHtml = sanitizeRichText(announcement.content);

  return (
    <article className="container-page max-w-3xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/announcements" className="hover:text-brand">
          Announcements
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-slate-700">{announcement.title}</span>
      </nav>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          {formatLongDate(announcement.publishedAt ?? announcement.createdAt)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{announcement.title}</h1>
      </header>

      {announcement.imageUrl ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <div
        className="rich-text mt-8 text-base leading-relaxed text-slate-700"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      <div className="mt-12">
        <Link
          href="/announcements"
          className="text-sm font-semibold text-brand hover:text-brand-light"
        >
          ← Back to announcements
        </Link>
      </div>
    </article>
  );
}
