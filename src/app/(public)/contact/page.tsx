import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/ui";
import { church } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: `Contact ${church.name} — send a prayer request, ask a question, or plan your visit.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We would love to hear from you"
        description="Send us a message and a member of our team will respond as soon as possible."
      />

      <section className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-cream p-6">
            <h2 className="text-lg font-semibold text-ink">Church information</h2>
            <address className="mt-4 space-y-3 text-sm not-italic text-slate-700">
              <p>
                <span className="block font-semibold">Address</span>
                {church.address}
                <br />
                {church.city}
              </p>
              <p>
                <span className="block font-semibold">Phone</span>
                <a
                  href={`tel:${church.phone.replace(/[^+\d]/g, "")}`}
                  className="text-brand hover:underline"
                >
                  {church.phone}
                </a>
              </p>
              <p>
                <span className="block font-semibold">Email</span>
                <a href={`mailto:${church.email}`} className="text-brand hover:underline">
                  {church.email}
                </a>
              </p>
            </address>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-ink">Service times</h2>
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {church.serviceTimes.map((service) => (
                <li key={service.name} className="flex justify-between gap-4 py-2">
                  <span className="font-medium text-slate-700">{service.name}</span>
                  <span className="text-slate-600">{service.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-ink">Follow us</h2>
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {church.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-brand hover:text-brand"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-ink">Send a message</h2>
          <p className="mt-2 text-sm text-slate-600">
            Fields marked with <span aria-hidden="true">*</span> are required. Prayer requests are
            handled confidentially by our pastoral team.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
