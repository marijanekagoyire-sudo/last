import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getSession, toPublicAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Your session has expired. Please sign in again.", 401);
    }
    return jsonOk({
      admin: toPublicAdmin(session.admin),
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    return handleRouteError("auth.me", error);
  }
}
