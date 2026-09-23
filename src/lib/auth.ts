import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, administrators, type Administrator } from "@/db/schema";
import { HttpError, getClientIp } from "./api";
import { logger } from "./logger";

export const SESSION_COOKIE = "church_admin_session";
export const CSRF_COOKIE = "church_admin_csrf";
export const CSRF_HEADER = "x-csrf-token";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

let warnedAboutSecret = false;

function secretKey(): Uint8Array {
  const configured = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) {
    return new TextEncoder().encode(configured);
  }
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    logger.warn(
      "JWT_SECRET is not configured; deriving an ephemeral signing key. Set JWT_SECRET in the environment for production deployments.",
    );
  }
  // Derived (never hard-coded) fallback so local/dev boots without secrets.
  const derived = createHash("sha256")
    .update(`${process.env.DATABASE_URL ?? "local"}::church-admin-session`)
    .digest();
  return new Uint8Array(derived);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`ip::${ip}`).digest("hex").slice(0, 64);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export type PublicAdmin = {
  id: number;
  email: string;
  fullName: string;
  role: Administrator["role"];
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

export function toPublicAdmin(admin: Administrator): PublicAdmin {
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
    lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
  };
}

type SessionContext = { admin: Administrator; sessionId: string; csrfToken: string };

/**
 * Verifies credentials with brute-force protection and creates a database
 * backed session. Returns the signed session token + CSRF token.
 */
export async function login(
  email: string,
  password: string,
  request: Request,
): Promise<{ admin: Administrator; token: string; csrfToken: string; expiresAt: Date }> {
  const normalizedEmail = email.trim().toLowerCase();
  const [admin] = await db
    .select()
    .from(administrators)
    .where(eq(administrators.email, normalizedEmail))
    .limit(1);

  const genericError = new HttpError(401, "Invalid email or password.");

  if (!admin || !admin.isActive) {
    // Constant-ish work factor so unknown emails are not distinguishable.
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEe.HqO0dVfE5H2G6ph.hyDl2N9wLLTS0dm");
    logger.warn("Failed admin login", { email: normalizedEmail, reason: "unknown-or-inactive" });
    throw genericError;
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    logger.warn("Blocked admin login on locked account", { adminId: admin.id });
    throw new HttpError(
      429,
      `Account temporarily locked after repeated failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
    );
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await db
      .update(administrators)
      .set({
        failedLoginAttempts: attempts,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(administrators.id, admin.id));
    logger.warn("Failed admin login", { adminId: admin.id, attempts, locked: Boolean(lockedUntil) });
    throw genericError;
  }

  const sessionId = randomBytes(16).toString("hex");
  const csrfToken = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const token = await new SignJWT({ sid: sessionId, role: admin.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin.id))
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  await db.transaction(async (tx) => {
    await tx.insert(adminSessions).values({
      id: sessionId,
      administratorId: admin.id,
      tokenHash: hashToken(token),
      csrfToken,
      userAgent: (request.headers.get("user-agent") ?? "").slice(0, 255) || null,
      ipHash: hashIp(getClientIp(request)),
      expiresAt,
    });
    await tx
      .update(administrators)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(administrators.id, admin.id));
    // Housekeeping: drop expired sessions for this admin.
    await tx.delete(adminSessions).where(
      and(
        eq(adminSessions.administratorId, admin.id),
        sql`${adminSessions.expiresAt} < now()`,
      ),
    );
  });

  return { admin, token, csrfToken, expiresAt };
}

export async function setSessionCookies(token: string, csrfToken: string, expiresAt: Date) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
  jar.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

/** Resolves the current session from cookies; returns null when unauthenticated. */
export async function getSession(): Promise<SessionContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let sessionId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    sessionId = String(payload.sid ?? "");
    if (!sessionId) return null;
  } catch {
    return null;
  }

  const rows = await db
    .select({ session: adminSessions, admin: administrators })
    .from(adminSessions)
    .innerJoin(administrators, eq(adminSessions.administratorId, administrators.id))
    .where(and(eq(adminSessions.id, sessionId), isNull(adminSessions.revokedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt.getTime() <= Date.now()) return null;
  if (!safeEquals(row.session.tokenHash, hashToken(token))) return null;
  if (!row.admin.isActive) return null;

  return { admin: row.admin, sessionId: row.session.id, csrfToken: row.session.csrfToken };
}

export async function revokeSession(sessionId: string) {
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.id, sessionId));
}

export async function revokeAllSessionsForAdmin(administratorId: number) {
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.administratorId, administratorId), isNull(adminSessions.revokedAt)));
}

/**
 * Authorisation guard for API route handlers. Enforces authentication plus
 * double-submit CSRF verification on state-changing requests.
 */
export async function requireAdmin(request: Request): Promise<SessionContext> {
  const session = await getSession();
  if (!session) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }

  const method = request.method.toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const header = request.headers.get(CSRF_HEADER) ?? "";
    if (!header || !safeEquals(header, session.csrfToken)) {
      logger.warn("CSRF verification failed", { adminId: session.admin.id, method });
      throw new HttpError(403, "Security check failed. Please refresh the page and try again.");
    }
  }

  return session;
}
