import type { Metadata } from "next";
import type { ReactNode } from "react";
import { church } from "@/lib/site";
import "./globals.css";

// Canonical origin: explicit configuration first, then the Render-provided URL,
// finally a local development fallback.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${church.name} | ${church.tagline}`,
    template: `%s | ${church.name}`,
  },
  description: church.mission,
  applicationName: church.name,
  keywords: [
    "church",
    "christian church",
    "worship",
    "sermons",
    "bible study",
    church.name,
    church.city,
  ],
  openGraph: {
    type: "website",
    siteName: church.name,
    title: `${church.name} | ${church.tagline}`,
    description: church.mission,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: church.name,
    description: church.mission,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-800 antialiased">{children}</body>
    </html>
  );
}
