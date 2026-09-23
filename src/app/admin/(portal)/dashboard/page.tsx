"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, dashboardApi, type DashboardPayload } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";

const QUICK_ACTIONS = [
  { href: "/admin/events", label: "Add Event", icon: "📅" },
  { href: "/admin/announcements", label: "Add Announcement", icon: "📢" },
  { href: "/admin/sermons", label: "Add Sermon", icon: "🎧" },
  { href: "/admin/media", label: "Add Media", icon: "🖼️" },
  { href: "/admin/messages", label: "View Messages", icon: "✉️" },
];

function actionLabel(action: string) {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export default function AdminDashboardPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.load();
      setPayload(response.data);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      setError(
        caught instanceof ApiError ? caught.message : "Unable to load dashboard data right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = payload?.stats;

  const cards = [
    { label: "Total events", value: stats?.totalEvents, href: "/admin/events" },
    { label: "Upcoming events", value: stats?.upcomingEvents, href: "/admin/events" },
    { label: "Announcements", value: stats?.totalAnnouncements, href: "/admin/announcements" },
    { label: "Sermons", value: stats?.totalSermons, href: "/admin/sermons" },
    { label: "Media items", value: stats?.totalMedia, href: "/admin/media" },
    { label: "Total messages", value: stats?.totalMessages, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of published content and incoming messages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : null}

      <section aria-label="New messages">
        <Link
          href="/admin/messages?status=NEW"
          className="flex items-center justify-between gap-4 rounded-xl border border-brand/20 bg-white p-5 shadow-sm hover:border-brand"
        >
          <div>
            <p className="text-sm font-medium text-slate-500">Unread messages</p>
            <p className="mt-1 text-3xl font-semibold text-brand">
              {loading ? <span className="skeleton inline-block h-8 w-12 rounded" /> : (stats?.newMessages ?? 0)}
            </p>
          </div>
          <span aria-hidden="true" className="text-3xl">
            ✉️
          </span>
        </Link>
      </section>

      <section aria-label="Content statistics">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <li key={card.label}>
              <Link
                href={card.href}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {loading ? (
                    <span className="skeleton inline-block h-7 w-10 rounded" />
                  ) : (
                    (card.value ?? 0)
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Quick actions">
        <h2 className="text-lg font-semibold text-ink">Quick actions</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
              >
                <span aria-hidden="true">{action.icon}</span>
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Recent activity">
        <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, index) => (
                <li key={index} className="p-4">
                  <div className="skeleton h-4 w-1/2 rounded" />
                </li>
              ))}
            </ul>
          ) : !payload || payload.activity.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              No administrator activity has been recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payload.activity.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {actionLabel(entry.action)} · {entry.entityType.toLowerCase()}
                      {entry.metadata && typeof entry.metadata.title === "string"
                        ? ` — ${entry.metadata.title}`
                        : ""}
                    </p>
                    <p className="text-xs text-slate-500">{entry.administratorEmail ?? "System"}</p>
                  </div>
                  <time dateTime={entry.createdAt} className="text-xs text-slate-500">
                    {formatDateTime(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
