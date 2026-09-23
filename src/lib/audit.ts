import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { logger } from "./logger";

export type AuditInput = {
  administratorId: number | null;
  administratorEmail: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
};

/** Records an administrator action. Never throws into the request path. */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      administratorId: input.administratorId,
      administratorEmail: input.administratorEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId === null || input.entityId === undefined ? null : String(input.entityId),
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      action: input.action,
      detail: error instanceof Error ? error.message : "unknown",
    });
  }
}
