import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { handleRouteError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const query = listQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
    });

    const filters: SQL[] = [];
    if (query.status && (STATUSES as readonly string[]).includes(query.status)) {
      filters.push(eq(contactMessages.status, query.status as Status));
    }
    if (query.category) {
      filters.push(eq(contactMessages.category, query.category));
    }
    if (query.search) {
      const term = `%${query.search.replace(/[%_]/g, (m) => `\\${m}`)}%`;
      const clause = or(
        sql`${contactMessages.fullName} ILIKE ${term}`,
        sql`${contactMessages.email} ILIKE ${term}`,
        sql`${contactMessages.subject} ILIKE ${term}`,
        sql`${contactMessages.message} ILIKE ${term}`,
      );
      if (clause) filters.push(clause);
    }

    const where = filters.length ? and(...filters) : undefined;

    const [items, countRows, unreadRows] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(desc(contactMessages.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: sql<number>`count(*)::int` }).from(contactMessages).where(where),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(contactMessages)
        .where(eq(contactMessages.status, "NEW")),
    ]);

    const total = Number(countRows[0]?.value ?? 0);

    return jsonOk(items, {
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        unread: Number(unreadRows[0]?.value ?? 0),
      },
    });
  } catch (error) {
    return handleRouteError("messages.list", error);
  }
}
