import Link from "next/link";
import { AnnouncementCard, EventCard, MediaCard, SermonCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { getHomeData } from "@/lib/queries";
import { beliefs, church, ministries } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  description: `${church.name} — ${church.mission}`,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { upcomingEvents, announcements, sermons, media } = await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-worship.jpg"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container-page py-24 sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Welcome home to {church.shortName}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {church.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">{church.tagline} — {church.mission}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/events"
              className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
            >
              Join Us in Worship
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Learn More About Us
            </Link>
          </div>
          <dl className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
            {church.serviceTimes.slice(0, 2).map((service) => (
              <div key={service.name} className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
                <dt className="text-sm font-semibold text-white">{service.name}</dt>
                <dd className="text-sm text-slate-300">{service.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Welcome */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Welcome"
              title="A church family where you belong"
              description="Whether you are exploring faith for the first time or looking for a church home, you will find a warm welcome, faithful Bible teaching, and people who will walk with you."
            />
            <p className="mt-4 text-slate-600">
              We gather each week to worship Jesus, open the Scriptures together, pray for one
              another, and serve our neighbours across {church.city}. Come as you are — there is a
              seat for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/what-we-do"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
              >
                Explore our ministries
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Talk to a pastor
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-cream p-6">
              <h3 className="text-lg font-semibold text-ink">Our Mission</h3>
              <p className="mt-2 text-sm text-slate-600">{church.mission}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-cream p-6">
              <h3 className="text-lg font-semibold text-ink">Our Vision</h3>
              <p className="mt-2 text-sm text-slate-600">{church.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beliefs preview */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="What We Believe"
            title="Anchored in historic Christian faith"
            description="We hold to the truth of Scripture and the good news of Jesus Christ, taught clearly and lived out daily."
            align="center"
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beliefs.slice(0, 6).map((belief) => (
              <li key={belief.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold text-brand">{belief.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{belief.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link
              href="/beliefs"
              className="rounded-full border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
            >
              Read our full statement of faith
            </Link>
          </div>
        </div>
      </section>

      {/* Ministries preview */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="What We Do"
          title="Ministries serving every generation"
          description="From worship and prayer to outreach and missions, there is a place for you to grow and serve."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.slice(0, 6).map((ministry) => (
            <li
              key={ministry.title}
              className="rounded-xl border border-slate-200 p-5 transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true" className="text-2xl">
                {ministry.icon}
              </span>
              <h3 className="mt-3 text-base font-semibold text-ink">{ministry.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{ministry.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href="/what-we-do" className="text-sm font-semibold text-brand hover:text-brand-light">
            See all ministries →
          </Link>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Events" title="Upcoming events" />
            <Link href="/events" className="text-sm font-semibold text-brand hover:text-brand-light">
              View all events →
            </Link>
          </div>
          <div className="mt-8">
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="No upcoming events."
                description="New gatherings are published here as soon as they are scheduled."
              />
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Announcements + sermons */}
      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Announcements" title="Latest announcements" />
            <Link
              href="/announcements"
              className="text-sm font-semibold text-brand hover:text-brand-light"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6">
            {announcements.length === 0 ? (
              <EmptyState title="No announcements have been published." />
            ) : (
              <ul className="space-y-4">
                {announcements.map((announcement) => (
                  <li key={announcement.id}>
                    <AnnouncementCard announcement={announcement} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Sermons" title="Latest sermons" />
            <Link href="/sermons" className="text-sm font-semibold text-brand hover:text-brand-light">
              View all →
            </Link>
          </div>
          <div className="mt-6">
            {sermons.length === 0 ? (
              <EmptyState title="No sermons have been published yet." />
            ) : (
              <ul className="space-y-4">
                {sermons.map((sermon) => (
                  <li key={sermon.id}>
                    <SermonCard sermon={sermon} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Media" title="From our media library" />
            <Link href="/media" className="text-sm font-semibold text-brand hover:text-brand-light">
              Browse the gallery →
            </Link>
          </div>
          <div className="mt-8">
            {media.length === 0 ? (
              <EmptyState title="No media has been published yet." />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {media.map((item) => (
                  <li key={item.id}>
                    <MediaCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="container-page flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl">We would love to hear from you</h2>
            <p className="mt-3 text-slate-200">
              Have a question, a prayer request, or want to plan your first visit? Our team responds
              to every message.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
            >
              Contact us
            </Link>
            <a
              href={`tel:${church.phone.replace(/[^+\d]/g, "")}`}
              className="rounded-full border border-white/50 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Call {church.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
