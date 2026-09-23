import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/ui";
import { church, ministries } from "@/lib/site";

export const metadata = {
  title: "What We Do",
  description: `Ministries at ${church.name}: worship, prayer, evangelism, discipleship, youth, children, outreach, missions, charity, and leadership development.`,
  alternates: { canonical: "/what-we-do" },
};

export default function WhatWeDoPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Do"
        title="Ministries and activities"
        description="Every ministry exists to help people know Jesus, grow in Him, and serve others."
      />

      <section className="container-page py-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <li
              key={ministry.title}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true" className="text-3xl">
                {ministry.icon}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">{ministry.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{ministry.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-cream py-16">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Get involved"
              title="Find your place to serve"
              description="Serving is one of the clearest ways to grow. Tell us where you would like to help and a ministry leader will contact you."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
              >
                Volunteer with us
              </Link>
              <Link
                href="/events"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              >
                See upcoming events
              </Link>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {church.serviceTimes.map((service) => (
              <li key={service.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-ink">{service.name}</p>
                <p className="mt-1 text-sm text-slate-600">{service.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
