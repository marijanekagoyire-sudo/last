import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Render (and most managed Postgres providers) require TLS. Local development
 * databases usually do not support it, so TLS is enabled only when the
 * connection string asks for it or when running in production against a
 * non-local host.
 */
function resolveSsl(url: string): false | { rejectUnauthorized: boolean } {
  const explicitlyDisabled = /sslmode=disable/i.test(url);
  if (explicitlyDisabled) return false;

  const isLocal = /@(localhost|127\.0\.0\.1|::1)[:/]/i.test(url);
  const wantsSsl = /sslmode=(require|verify-ca|verify-full)/i.test(url);

  if (wantsSsl) return { rejectUnauthorized: false };
  if (!isLocal && process.env.NODE_ENV === "production") {
    return { rejectUnauthorized: false };
  }
  return false;
}

const globalForDb = globalThis as typeof globalThis & {
  __churchPgPool?: Pool;
};

export const pool =
  globalForDb.__churchPgPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: resolveSsl(databaseUrl),
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: false,
  });

// A transient database problem must never take the whole server down.
pool.on("error", (error) => {
  console.error(
    JSON.stringify({
      level: "error",
      scope: "database",
      message: "Idle client error",
      detail: error.message,
      timestamp: new Date().toISOString(),
    }),
  );
});

globalForDb.__churchPgPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
