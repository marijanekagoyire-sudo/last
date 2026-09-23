import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      {
        ok: true,
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("Health check failed", {
      detail: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { ok: false, status: "degraded", database: "disconnected" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
