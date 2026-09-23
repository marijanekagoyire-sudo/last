import { handleRouteError, jsonOk } from "@/lib/api";
import { clearSessionCookies, getSession, revokeSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await revokeSession(session.sessionId);
      await writeAuditLog({
        administratorId: session.admin.id,
        administratorEmail: session.admin.email,
        action: "LOGOUT",
        entityType: "SESSION",
        entityId: String(session.admin.id),
      });
    }
    await clearSessionCookies();
    return jsonOk({ signedOut: true });
  } catch (error) {
    return handleRouteError("auth.logout", error);
  }
}
