"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authApi, type AdminProfile } from "@/lib/api-client";
import { church } from "@/lib/site";
import { ToastProvider } from "./toast";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/events", label: "Events", icon: "📅" },
  { href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { href: "/admin/sermons", label: "Sermons", icon: "🎧" },
  { href: "/admin/media", label: "Media", icon: "🖼️" },
  { href: "/admin/messages", label: "Messages", icon: "✉️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminShell({ admin, children }: { admin: AdminProfile; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authApi.logout();
    } catch {
      // Even if the request fails the cookie is cleared on the next guard check.
    } finally {
      router.replace("/admin/login?reason=signed-out");
      router.refresh();
    }
  }

  const navigation = (
    <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-brand text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-100">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-ink p-4 lg:flex">
          <Link href="/admin/dashboard" className="flex items-center gap-2 px-2 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-base">
              ✝
            </span>
            <span className="text-sm font-semibold leading-tight">
              {church.shortName}
              <span className="block text-xs font-normal text-slate-400">Admin Portal</span>
            </span>
          </Link>
          <div className="mt-6 flex flex-1 flex-col">{navigation}</div>
          <div className="border-t border-white/10 pt-4">
            <p className="truncate px-3 text-xs text-slate-400">{admin.email}</p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              className="mt-2 w-full rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/60"
              role="presentation"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink p-4">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-semibold">{church.shortName} Admin</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-md border border-white/20 px-2 py-1"
                >
                  ✕
                </button>
              </div>
              <div className="mt-6 flex flex-1 flex-col">{navigation}</div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={signingOut}
                className="mt-4 rounded-md border border-white/20 px-3 py-2 text-sm text-slate-200 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Logout"}
              </button>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
                aria-expanded={drawerOpen}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:hidden"
              >
                ☰
              </button>
              <div>
                <p className="text-sm font-semibold text-ink">Administration</p>
                <p className="text-xs text-slate-500">Signed in as {admin.fullName}</p>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand"
            >
              View website ↗
            </Link>
          </header>

          {admin.mustChangePassword ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8">
              <strong className="font-semibold">Action required:</strong> this account is still using
              its initial password.{" "}
              <Link href="/admin/settings" className="font-semibold underline">
                Change it now
              </Link>
              .
            </div>
          ) : null}

          <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
