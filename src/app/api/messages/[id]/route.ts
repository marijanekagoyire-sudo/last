import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { HttpError, handleRouteError, jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { messageUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function parseId(context: RouteContext): Promise<number> {
  const { id } = await context.params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new HttpError(400, "Invalid message identifier.");
  }
  return numeric;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdmin(request);
    const id = await parseId(context);
    const [record] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id))
      .limit(1);
    if (!record) return jsonError("Message was not found.", 404);
    return jsonOk(record);
  } catch (error) {
    return handleRouteError("messages.detail", error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(request);
    const id = await parseId(context);
    const body = await readJsonBody(request, 2_000);
    const payload = messageUpdateSchema.parse(body);

    const [record] = await db
      .update(contactMessages)
      .set({ status: payload.status, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();

    if (!record) return jsonError("Message was not found.", 404);

    await writeAuditLog({
      administratorId: session.admin.id,
      administratorEmail: session.admin.email,
      action: `MESSAGE_${payload.status}`,
      entityType: "CONTACT_MESSAGE",
      entityId: String(id),
      metadata: { subject: record.subject },
    });

    return jsonOk(record);
  } catch (error) {
    return handleRouteError("messages.update", error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(request);
    const id = await parseId(context);
    const [record] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id, subject: contactMessages.subject });

    if (!record) return jsonError("Message was not found.", 404);

    await writeAuditLog({
      administratorId: session.admin.id,
      administratorEmail: session.admin.email,
      action: "MESSAGE_DELETE",
      entityType: "CONTACT_MESSAGE",
      entityId: String(id),
      metadata: { subject: record.subject },
    });

    return jsonOk({ id });
  } catch (error) {
    return handleRouteError("messages.delete", error);
  }
}
