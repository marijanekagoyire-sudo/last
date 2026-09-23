import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatLongDate } from "@/lib/format";
import { getSermonBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Converts common video URLs into privacy-friendly embed URLs. */
function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);
  if (!sermon) return { title: "Sermon not found" };

  const description = sermon.description.slice(0, 180);
  return {
    title: sermon.title,
    description,
    alternates: { canonical: `/sermons/${sermon.slug}` },
    openGraph: {
      title: sermon.title,
      description,
      type: "article",
      images: sermon.thumbnailUrl ? [sermon.thumbnailUrl] : undefined,
    },
  };
}

export default async function SermonDetailPage({ params }: Props) {
  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);
  if (!sermon) notFound();

  const embedUrl = sermon.videoUrl ? toEmbedUrl(sermon.videoUrl) : null;

  return (
    <article className="container-page max-w-4xl py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/sermons" className="hover:text-brand">
          Sermons
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-slate-700">{sermon.title}</span>
      </nav>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          <span>{formatLongDate(sermon.sermonDate)}</span>
          <span aria-hidden="true">•</span>
          <span>{sermon.category}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">{sermon.title}</h1>
        <p className="mt-2 text-slate-600">
          {sermon.speaker}
          {sermon.scripture ? ` · ${sermon.scripture}` : ""}
        </p>
      </header>

      {embedUrl ? (
        <div className="mt-8 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-black">
          <iframe
            src={embedUrl}
            title={`${sermon.title} video`}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : sermon.thumbnailUrl ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sermon.thumbnailUrl}
            alt={sermon.title}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      {sermon.audioUrl ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-cream p-5">
          <h2 className="text-base font-semibold text-ink">Listen to this message</h2>
          <audio controls preload="none" src={sermon.audioUrl} className="mt-3 w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : null}

      {sermon.videoUrl && !embedUrl ? (
        <p className="mt-6">
          <a
            href={sermon.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand hover:text-brand-light"
          >
            Watch the video recording →
          </a>
        </p>
      ) : null}

      <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-slate-700">
        {sermon.description}
      </div>

      <div className="mt-12">
        <Link href="/sermons" className="text-sm font-semibold text-brand hover:text-brand-light">
          ← Back to sermons
        </Link>
      </div>
    </article>
  );
}
