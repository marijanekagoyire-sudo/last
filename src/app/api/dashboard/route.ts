import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const [stats, activity] = await Promise.all([getDashboardStats(), getRecentActivity(8)]);
    return jsonOk({ stats, activity });
  } catch (error) {
    return handleRouteError("dashboard.stats", error);
  }
}
