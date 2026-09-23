"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, contentApi, type ContentRecord } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import { ConfirmDialog } from "./confirm-dialog";
import { RichTextEditor } from "./rich-text-editor";
import { useToast } from "./toast";

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "richtext" | "date" | "time" | "url" | "select";
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  help?: string;
  full?: boolean;
  defaultValue?: string;
};

export type ColumnConfig = {
  key: string;
  label: string;
  render?: (record: ContentRecord) => ReactNode;
};

type ResourceKey = "events" | "announcements" | "sermons" | "media";

const PAGE_SIZE = 10;

function toFormValues(fields: FieldConfig[], record?: ContentRecord | null) {
  const values: Record<string, string> = { status: (record?.status as string) ?? "DRAFT" };
  for (const field of fields) {
    const raw = record ? record[field.name] : undefined;
    values[field.name] =
      raw === null || raw === undefined ? (record ? "" : (field.defaultValue ?? "")) : String(raw);
  }
  return values;
}

function validateValues(fields: FieldConfig[], values: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (!value) continue;
    if (field.type === "url" && !/^https?:\/\/\S+$/i.test(value)) {
      errors[field.name] = "Enter a valid URL starting with http:// or https://";
    }
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      errors[field.name] = "Use the format YYYY-MM-DD.";
    }
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      errors[field.name] = "Use 24-hour format HH:MM.";
    }
  }
  return errors;
}

export function ResourceManager({
  resource,
  singular,
  plural,
  fields,
  columns,
  publicPath,
  categories,
}: {
  resource: ResourceKey;
  singular: string;
  plural: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  publicPath: string;
  categories?: readonly string[];
}) {
  const api = useMemo(() => contentApi(resource), [resource]);
  const { notify } = useToast();

  const [items, setItems] = useState<ContentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentRecord | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => toFormValues(fields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ContentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyRow, setBusyRow] = useState<number | null>(null);

  const requestRef = useRef<AbortController | null>(null);

  // Debounced search keeps API traffic low while typing.
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
    setLoadError(null);

    try {
      const response = await api.list(
        {
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
        controller.signal,
      );
      setItems(response.data ?? []);
      const meta = response.meta ?? {};
      setTotal(Number(meta.total ?? 0));
      setTotalPages(Number(meta.totalPages ?? 1));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError(
        error instanceof ApiError
          ? error.message
          : `Unable to load ${plural.toLowerCase()} right now.`,
      );
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, [api, page, search, statusFilter, categoryFilter, plural]);

  useEffect(() => {
    void load();
    return () => requestRef.current?.abort();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setValues(toFormValues(fields));
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEdit(record: ContentRecord) {
    setEditing(record);
    setValues(toFormValues(fields, record));
    setFieldErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return; // prevents double submission

    const errors = validateValues(fields, values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      notify("Please correct the highlighted fields.", "error");
      return;
    }

    const payload: Record<string, unknown> = { status: values.status };
    for (const field of fields) {
      payload[field.name] = (values[field.name] ?? "").trim();
    }

    setSaving(true);
    try {
      if (editing) {
        await api.update(editing.id, payload);
        notify(`${singular} updated successfully.`);
      } else {
        await api.create(payload);
        notify(`${singular} created successfully.`);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          window.location.href = "/admin/login?reason=expired";
          return;
        }
        if (error.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.errors)) {
            mapped[key] = messages[0] ?? "Invalid value.";
          }
          setFieldErrors(mapped);
        }
        notify(error.message, "error");
      } else {
        notify("Unable to save changes.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(record: ContentRecord) {
    const nextStatus = record.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusyRow(record.id);
    // Optimistic update - reverted if the request fails.
    setItems((current) =>
      current.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)),
    );
    try {
      await api.update(record.id, { status: nextStatus });
      notify(
        nextStatus === "PUBLISHED"
          ? `${singular} published successfully.`
          : `${singular} moved back to draft.`,
      );
      await load();
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.id === record.id ? { ...item, status: record.status } : item,
        ),
      );
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      notify(error instanceof ApiError ? error.message : "Unable to update status.", "error");
    } finally {
      setBusyRow(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.remove(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setTotal((current) => Math.max(0, current - 1));
      notify(`${singular} deleted successfully.`);
      setDeleteTarget(null);
      await load();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = "/admin/login?reason=expired";
        return;
      }
      notify(error instanceof ApiError ? error.message : "Unable to delete record.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(search || statusFilter || categoryFilter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{plural}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading…" : `${total} ${total === 1 ? "record" : "records"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
        >
          + Add {singular}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="resource-search" className="sr-only">
            Search {plural.toLowerCase()}
          </label>
          <input
            id="resource-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${plural.toLowerCase()}…`}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="resource-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="resource-status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        {categories ? (
          <div>
            <label htmlFor="resource-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="resource-category"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setStatusFilter("");
              setCategoryFilter("");
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-brand hover:text-brand"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {loadError ? (
        <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="p-4">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton mt-2 h-3 w-1/2 rounded" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-base font-semibold text-slate-700">
              {hasFilters
                ? `No ${plural.toLowerCase()} match your filters.`
                : `No ${plural.toLowerCase()} have been created yet.`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasFilters
                ? "Adjust the search or filters to see more results."
                : `Create your first ${singular.toLowerCase()} to publish it on the website.`}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
            >
              Create {singular}
            </button>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className="px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                        {column.render
                          ? column.render(record)
                          : String(record[column.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(record)}
                          className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void togglePublish(record)}
                          disabled={busyRow === record.id}
                          className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-60"
                        >
                          {busyRow === record.id
                            ? "Saving…"
                            : record.status === "PUBLISHED"
                              ? "Unpublish"
                              : "Publish"}
                        </button>
                        {record.status === "PUBLISHED" && record.slug ? (
                          <Link
                            href={`${publicPath}/${String(record.slug)}`}
                            target="_blank"
                            className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
                          >
                            Preview
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(record)}
                          className="rounded border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:border-red-400 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((record) => (
                <li key={record.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{record.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {formatDate(String(record.createdAt ?? ""))}
                      </p>
                    </div>
                    <StatusBadge status={String(record.status)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(record)}
                      className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void togglePublish(record)}
                      disabled={busyRow === record.id}
                      className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
                    >
                      {record.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(record)}
                      className="rounded border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
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
            className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      {formOpen ? (
        <div
          className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) setFormOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-form-title"
            className="my-8 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="resource-form-title" className="text-lg font-semibold text-ink">
                {editing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
              </h2>
              <button
                type="button"
                onClick={() => !saving && setFormOpen(false)}
                aria-label="Close form"
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-500 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                  const error = fieldErrors[field.name];
                  const inputId = `field-${field.name}`;
                  const describedBy = error
                    ? `${inputId}-error`
                    : field.help
                      ? `${inputId}-help`
                      : undefined;
                  const baseClass = `mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                    error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-brand"
                  }`;

                  return (
                    <div
                      key={field.name}
                      className={field.full || field.type !== "text" ? "sm:col-span-2" : ""}
                    >
                      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required ? <span aria-hidden="true"> *</span> : null}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          id={inputId}
                          rows={5}
                          value={values[field.name] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.name]: event.target.value }))
                          }
                          aria-invalid={Boolean(error)}
                          aria-describedby={describedBy}
                          placeholder={field.placeholder}
                          className={baseClass}
                        />
                      ) : field.type === "richtext" ? (
                        <RichTextEditor
                          id={inputId}
                          value={values[field.name] ?? ""}
                          onChange={(next) =>
                            setValues((current) => ({ ...current, [field.name]: next }))
                          }
                          invalid={Boolean(error)}
                          describedBy={describedBy}
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={inputId}
                          value={values[field.name] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.name]: event.target.value }))
                          }
                          aria-describedby={describedBy}
                          className={baseClass}
                        >
                          {(field.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={inputId}
                          type={
                            field.type === "date"
                              ? "date"
                              : field.type === "time"
                                ? "time"
                                : field.type === "url"
                                  ? "url"
                                  : "text"
                          }
                          value={values[field.name] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.name]: event.target.value }))
                          }
                          aria-invalid={Boolean(error)}
                          aria-describedby={describedBy}
                          placeholder={field.placeholder}
                          className={baseClass}
                        />
                      )}

                      {error ? (
                        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
                          {error}
                        </p>
                      ) : field.help ? (
                        <p id={`${inputId}-help`} className="mt-1 text-xs text-slate-500">
                          {field.help}
                        </p>
                      ) : null}
                    </div>
                  );
                })}

                <div>
                  <label htmlFor="field-status" className="text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    id="field-status"
                    value={values.status ?? "DRAFT"}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, status: event.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  >
                    <option value="DRAFT">Draft (hidden from the public website)</option>
                    <option value="PUBLISHED">Published (visible on the public website)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : `Create ${singular.toLowerCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete this ${singular.toLowerCase()}?`}
        description={
          deleteTarget
            ? `"${String(deleteTarget.title)}" will be removed from the website. This action cannot be undone from the portal.`
            : undefined
        }
        busy={deleting}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
