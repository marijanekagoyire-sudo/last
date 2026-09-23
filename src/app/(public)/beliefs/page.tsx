import Link from "next/link";
import { PageHero } from "@/components/ui";
import { beliefs, church } from "@/lib/site";

export const metadata = {
  title: "What We Believe",
  description: `The statement of faith of ${church.name}: the Bible, God, Jesus Christ, the Holy Spirit, salvation, the church, baptism, Christian living, the resurrection, and eternal life.`,
  alternates: { canonical: "/beliefs" },
};

export default function BeliefsPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Believe"
        title="Our statement of faith"
        description="These convictions shape our preaching, our worship, and the way we live as a church family."
      />

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Beliefs sections" className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">On this page</p>
            <ul className="mt-4 space-y-2 text-sm">
              {beliefs.map((belief) => (
                <li key={belief.title}>
                  <a
                    href={`#${belief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="text-slate-600 hover:text-brand"
                  >
                    {belief.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-8">
            {beliefs.map((belief) => (
              <article
                key={belief.title}
                id={belief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-brand">{belief.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{belief.body}</p>
              </article>
            ))}

            <div className="rounded-xl bg-cream p-6">
              <h2 className="text-lg font-semibold text-ink">Questions about faith?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Our pastors would be glad to talk with you about what it means to follow Jesus.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-light"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
