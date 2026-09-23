import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

export type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

export function jsonOk<T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: Record<string, string> },
) {
  const body: ApiSuccess<T> = { success: true, data };
  if (init?.meta) body.meta = init.meta;
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { ...SECURITY_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function jsonError(
  message: string,
  status = 400,
  errors?: Record<string, string[]>,
  headers?: Record<string, string>,
) {
  const body: ApiFailure = { success: false, message };
  if (errors) body.errors = errors;
  return NextResponse.json(body, {
    status,
    headers: { ...SECURITY_HEADERS, ...(headers ?? {}) },
  });
}

/** Thrown by service/handler code to short-circuit with a safe client message. */
export class HttpError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function flattenZodError(error: ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    output[key] = [...(output[key] ?? []), issue.message];
  }
  return output;
}

/**
 * Centralised error handling: internal details are logged, never returned.
 */
export function handleRouteError(scope: string, error: unknown) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status, error.errors);
  }
  if (error instanceof ZodError) {
    return jsonError("Please correct the highlighted fields.", 422, flattenZodError(error));
  }

  const detail = error instanceof Error ? error.message : "Unknown error";
  logger.error("Unhandled API error", { scope, detail });
  return jsonError("Unable to process request. Please try again later.", 500);
}

export async function readJsonBody(request: Request, maxBytes = 100_000): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    throw new HttpError(413, "Request payload is too large.");
  }
  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new HttpError(413, "Request payload is too large.");
  }
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
