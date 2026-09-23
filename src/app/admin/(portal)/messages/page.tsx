"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { StatusBadge } from "@/components/ui";
import { ApiError, messagesApi, type MessageRecord } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "NEW", label: "Unread" },
  { value: "READ", label: "Read" },
  { value: "REPLIED", label: "Replied" },
  { value: "ARCHIVED", label: "Archived" },
];

const PAGE_SIZE = 10;

export default function AdminMessagesPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<MessageRecord[]>([]);
  const [selected, setSelected] = useState<MessageRecord | null>(null);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("status") ?? "";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MessageRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await messagesApi.list(
        { page, pageSize: PAGE_SIZE, search: search || undefined, status: status || undefined },
        controller.signal,
      );
      setItems(response.data ?? []);
      const meta = response.meta ?? {};
      setTotal(Number(meta.total ?? 0));
      setTotalPages(Number(meta.totalPages ?? 1));
      setUnread(Number(meta.unread ?? 0));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof ApiError ? caught.message : "Unable to load messages right now.");
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
    return () => requestRef.current?.abort();
  }, [load]);

  const updateStatus = useCallback(
    async (message: MessageRecord, next: MessageRecord["status"], quiet = false) => {
      setBusy(true);
      try {
        const response = await messagesApi.updateStatus(message.id, next);
        setItems((current) =>
          current.map((item) => (item.id === message.id ? response.data : item)),
        );
        setSelected((current) => (current && current.id === message.id ? response.data : current));
        setUnread((current) => {
          if (message.status === "NEW" && next !== "NEW") return Math.max(0, current - 1);
          if (message.status !== "NEW" && next === "NEW") return current + 1;
          return current;
        });
        if (!quiet) {
          notify(
            next === "ARCHIVED"
              ? "Message archived successfully."
              : `Message marked as ${next.toLowerCase()}.`,
          );
        }
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          window.location.href = "/admin/login?reason=expired";
          return;
        }
        notify(caught instanceof ApiError ? caught.message : "Unable to update message.", "error");
      } finally {
        setBusy(false);
      }
    },
    [notify],
  );

  function openMessage(message: MessageRecord) {
    setSelected(message);
    if (message.status === "NEW") {
      void updateStatus(message, "READ", true);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await messagesApi.remove(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setTotal((current) => Math.max(0, current - 1));
      if (deleteTarget.status === "NEW") setUnread((current) => Math.max(0, current - 1));
      if (selected?.id === deleteTarget.id) setSelected(null);
      notify("Message deleted successfully.");
      setDeleteTarget(null);
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      notify(caught instanceof ApiError ? caught.message : "Unable to delete message.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Messages</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading…" : `${total} ${total === 1 ? "message" : "messages"}`} ·{" "}
            <span className="font-semibold text-brand">{unread} unread</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="message-search" className="sr-only">
            Search messages
          </label>
          <input
            id="message-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by sender, email, or subject…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              aria-pressed={status === filter.value}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                status === filter.value
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-brand hover:text-brand"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="p-4">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton mt-2 h-3 w-2/3 rounded" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">
              No messages match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((message) => {
                const isUnread = message.status === "NEW";
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-slate-50 ${
                        selected?.id === message.id ? "bg-cream" : ""
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span
                          className={`truncate text-sm ${
                            isUnread ? "font-bold text-ink" : "font-medium text-slate-700"
                          }`}
                        >
                          {isUnread ? (
                            <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600" />
                          ) : null}
                          {message.fullName}
                        </span>
                        <StatusBadge status={message.status} />
                      </span>
                      <span className="truncate text-sm text-slate-600">{message.subject}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{message.category}</span>
                        <span aria-hidden="true">•</span>
                        <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {selected.fullName} ·{" "}
                    <a href={`mailto:${selected.email}`} className="text-brand hover:underline">
                      {selected.email}
                    </a>
                  </p>
                  {selected.phone ? (
                    <p className="text-sm text-slate-600">{selected.phone}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {selected.category} · {formatDateTime(selected.createdAt)}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <p className="mt-5 whitespace-pre-line rounded-md bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {selected.message}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-light"
                >
                  Reply by email
                </a>
                {selected.status !== "NEW" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(selected, "NEW")}
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                  >
                    Mark unread
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(selected, "READ")}
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateStatus(selected, "REPLIED")}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                >
                  Mark replied
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateStatus(selected, "ARCHIVED")}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                >
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selected)}
                  className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              Select a message to read the full details.
            </p>
          )}
        </div>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        description={
          deleteTarget
            ? `The message from ${deleteTarget.fullName} will be permanently removed.`
            : undefined
        }
        busy={deleting}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
