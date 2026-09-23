import { getClientIp, handleRouteError, jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { login, setSessionCookies, toPublicAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const key = `login:${ip}`;
  try {
    const limit = rateLimit(key, 10, 5 * 60_000);
    if (!limit.allowed) {
      logger.warn("Login rate limit reached", { ip });
      return jsonError(
        "Too many sign-in attempts. Please wait a few minutes and try again.",
        429,
        undefined,
        { "Retry-After": String(limit.retryAfterSeconds) },
      );
    }

    const body = await readJsonBody(request, 5_000);
    const credentials = loginSchema.parse(body);

    const { admin, token, csrfToken, expiresAt } = await login(
      credentials.email,
      credentials.password,
      request,
    );

    await setSessionCookies(token, csrfToken, expiresAt);
    resetRateLimit(key);

    await writeAuditLog({
      administratorId: admin.id,
      administratorEmail: admin.email,
      action: "LOGIN",
      entityType: "SESSION",
      entityId: String(admin.id),
    });

    logger.info("Administrator signed in", { adminId: admin.id });

    return jsonOk({
      admin: toPublicAdmin(admin),
      csrfToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError("auth.login", error);
  }
}
