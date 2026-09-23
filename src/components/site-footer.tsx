import Link from "next/link";
import { church } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-ink text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{church.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{church.mission}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { href: "/about", label: "About Us" },
              { href: "/beliefs", label: "What We Believe" },
              { href: "/what-we-do", label: "What We Do" },
              { href: "/publications", label: "Publications" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Gatherings</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {church.serviceTimes.map((service) => (
              <li key={service.name}>
                <span className="block text-slate-200">{service.name}</span>
                <span>{service.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-slate-400">
            <p>
              {church.address}
              <br />
              {church.city}
            </p>
            <p>
              <a href={`tel:${church.phone.replace(/[^+\d]/g, "")}`} className="hover:text-white">
                {church.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${church.email}`} className="hover:text-white">
                {church.email}
              </a>
            </p>
          </address>
          <ul className="mt-4 flex gap-3 text-sm">
            {church.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-700 px-3 py-1.5 hover:border-gold hover:text-white"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {church.name}. All rights reserved.
          </p>
          <p>Built to serve the church family and our community.</p>
        </div>
      </div>
    </footer>
  );
}
