import { eq } from "drizzle-orm";
import { db } from "@/db";
import { administrators } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk, readJsonBody } from "@/lib/api";
import {
  hashPassword,
  requireAdmin,
  revokeAllSessionsForAdmin,
  clearSessionCookies,
  verifyPassword,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { changePasswordSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = await readJsonBody(request, 5_000);
    const payload = changePasswordSchema.parse(body);

    const valid = await verifyPassword(payload.currentPassword, session.admin.passwordHash);
    if (!valid) {
      return jsonError("Your current password is incorrect.", 400, {
        currentPassword: ["Your current password is incorrect."],
      });
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await db.transaction(async (tx) => {
      await tx
        .update(administrators)
        .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
        .where(eq(administrators.id, session.admin.id));
    });

    await writeAuditLog({
      administratorId: session.admin.id,
      administratorEmail: session.admin.email,
      action: "CHANGE_PASSWORD",
      entityType: "ADMINISTRATOR",
      entityId: String(session.admin.id),
    });

    // Force re-authentication everywhere after a credential change.
    await revokeAllSessionsForAdmin(session.admin.id);
    await clearSessionCookies();

    return jsonOk({ updated: true });
  } catch (error) {
    return handleRouteError("auth.password", error);
  }
}
