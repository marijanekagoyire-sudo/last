import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "church_admin_session";

/**
 * Builds the list of origins allowed to call the API with credentials.
 * In production only the configured frontend origin(s) are accepted.
 */
function allowedOrigins(request: NextRequest): string[] {
  const configured = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
  ].filter((value): value is string => Boolean(value));

  const origins = configured.map((value) => value.replace(/\/$/, ""));
  origins.push(request.nextUrl.origin);

  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return Array.from(new Set(origins));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ------------------------------- API / CORS ------------------------------ */
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowed = allowedOrigins(request);

    if (origin && !allowed.includes(origin.replace(/\/$/, ""))) {
      // Cross-origin requests from unknown origins are rejected outright.
      return NextResponse.json(
        { success: false, message: "Origin not allowed." },
        { status: 403 },
      );
    }

    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      if (origin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Vary", "Origin");
      }
      response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-csrf-token");
      response.headers.set("Access-Control-Max-Age", "600");
      return response;
    }

    const response = NextResponse.next();
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Vary", "Origin");
    }
    return response;
  }

  /* ------------------------------ Admin routes ----------------------------- */
  // Fast UX guard only. Authoritative verification happens server-side in the
  // portal layout and in every protected API route handler.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "?reason=expired";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
