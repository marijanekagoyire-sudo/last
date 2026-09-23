"use client";

/**
 * Centralised browser API client. Every request in the application goes
 * through this module — no raw fetch calls are scattered across components.
 *
 * The base URL is configurable so the frontend can point at a separately
 * deployed backend (e.g. an external Render web service) without code changes.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
const CSRF_COOKIE = "church_admin_csrf";
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type ApiResponse<T> = { data: T; meta?: Record<string, unknown> };

function readCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const method = options.method ?? "GET";
  const url = new URL(`${API_BASE}${path}`, window.location.origin);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "" && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["x-csrf-token"] = readCsrfToken();

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "The request timed out. Please check your connection and try again.");
    }
    throw new ApiError(0, "Unable to reach the server. Please check your connection.");
  }
  clearTimeout(timeout);

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  const body = (payload ?? {}) as {
    success?: boolean;
    data?: T;
    meta?: Record<string, unknown>;
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok || body.success === false) {
    throw new ApiError(
      response.status,
      body.message ?? "Unable to process request. Please try again.",
      body.errors,
    );
  }

  return { data: body.data as T, meta: body.meta };
}

/* --------------------------------- Modules -------------------------------- */

export type AdminProfile = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

export const authApi = {
  login: (email: string, password: string) =>
    request<{ admin: AdminProfile; csrfToken: string; expiresAt: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  logout: () => request<{ signedOut: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<{ admin: AdminProfile; csrfToken: string }>("/auth/me"),
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => request<{ updated: boolean }>("/auth/password", { method: "POST", body: payload }),
};

export type ContentRecord = Record<string, unknown> & { id: number; title: string; status: string };

export function contentApi(resource: "events" | "announcements" | "sermons" | "media") {
  return {
    list: (query: Record<string, string | number | undefined>, signal?: AbortSignal) =>
      request<ContentRecord[]>(`/${resource}`, { query: { ...query, view: "admin" }, signal }),
    get: (id: number) => request<ContentRecord>(`/${resource}/${id}`),
    create: (body: Record<string, unknown>) =>
      request<ContentRecord>(`/${resource}`, { method: "POST", body }),
    update: (id: number, body: Record<string, unknown>) =>
      request<ContentRecord>(`/${resource}/${id}`, { method: "PUT", body }),
    remove: (id: number) => request<{ id: number }>(`/${resource}/${id}`, { method: "DELETE" }),
  };
}

export type MessageRecord = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  category: string;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

export const messagesApi = {
  list: (query: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    request<MessageRecord[]>("/messages", { query, signal }),
  get: (id: number) => request<MessageRecord>(`/messages/${id}`),
  updateStatus: (id: number, status: MessageRecord["status"]) =>
    request<MessageRecord>(`/messages/${id}`, { method: "PATCH", body: { status } }),
  remove: (id: number) => request<{ id: number }>(`/messages/${id}`, { method: "DELETE" }),
};

export type DashboardPayload = {
  stats: {
    totalEvents: number;
    upcomingEvents: number;
    publishedEvents: number;
    totalAnnouncements: number;
    totalSermons: number;
    totalMedia: number;
    newMessages: number;
    totalMessages: number;
  };
  activity: {
    id: number;
    action: string;
    entityType: string;
    entityId: string | null;
    administratorEmail: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }[];
};

export const dashboardApi = {
  load: (signal?: AbortSignal) => request<DashboardPayload>("/dashboard", { signal }),
};

export const contactApi = {
  send: (payload: Record<string, unknown>) =>
    request<{ received: boolean }>("/contact", { method: "POST", body: payload }),
};
