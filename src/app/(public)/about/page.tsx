import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/ui";
import { church, coreValues, history, leadership } from "@/lib/site";

export const metadata = {
  title: "About Us",
  description: `Learn about the history, mission, vision, values, and leadership of ${church.name}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={`Getting to know ${church.name}`}
        description="A Bible-teaching, Christ-exalting church family serving our city since 1998."
      />

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-cream p-6">
            <h2 className="text-lg font-semibold text-ink">Our Mission</h2>
            <p className="mt-2 text-sm text-slate-600">{church.mission}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-cream p-6">
            <h2 className="text-lg font-semibold text-ink">Our Vision</h2>
            <p className="mt-2 text-sm text-slate-600">{church.vision}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-cream p-6">
            <h2 className="text-lg font-semibold text-ink">Statement of Purpose</h2>
            <p className="mt-2 text-sm text-slate-600">
              We exist for the glory of God — gathering for worship, growing in the Word, caring for
              one another, and going out with the gospel in word and deed.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Our story" title="Church history" />
          <ol className="mt-8 space-y-6 border-l-2 border-gold/50 pl-6">
            {history.map((item) => (
              <li key={item.year}>
                <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                  {item.year}
                </p>
                <p className="mt-1 text-slate-700">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Core values" title="What shapes our life together" />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coreValues.map((value) => (
            <li key={value.title} className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-brand">{value.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{value.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-cream py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Leadership" title="Our pastoral and ministry team" />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((leader) => (
              <li key={leader.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white"
                >
                  {leader.name
                    .split(" ")
                    .slice(-2)
                    .map((part) => part.charAt(0))
                    .join("")}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{leader.name}</h3>
                <p className="text-sm font-medium text-gold">{leader.role}</p>
                <p className="mt-2 text-sm text-slate-600">{leader.bio}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Gather with us" title="Service times" />
            <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {church.serviceTimes.map((service) => (
                <li key={service.name} className="flex items-center justify-between gap-4 p-4">
                  <span className="font-medium text-ink">{service.name}</span>
                  <span className="text-sm text-slate-600">{service.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Find us" title="Location" />
            <div className="mt-6 rounded-xl border border-slate-200 p-6">
              <address className="not-italic text-slate-700">
                {church.address}
                <br />
                {church.city}
              </address>
              <p className="mt-4 text-sm text-slate-600">
                Free parking is available on site, and our welcome team will help you find children&apos;s
                check-in and the sanctuary.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
              >
                Plan your visit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
