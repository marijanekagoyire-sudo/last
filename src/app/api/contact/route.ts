import { createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { getClientIp, handleRouteError, jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizePlainText } from "@/lib/sanitize";
import { contactSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  try {
    const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
    if (!limit.allowed) {
      return jsonError(
        "You have sent several messages recently. Please try again in a few minutes.",
        429,
        undefined,
        { "Retry-After": String(limit.retryAfterSeconds) },
      );
    }

    const body = await readJsonBody(request, 20_000);
    const payload = contactSchema.parse(body);

    // Honeypot: silently accept but never store obvious bot submissions.
    if (payload.website && payload.website.trim() !== "") {
      logger.warn("Contact honeypot triggered", { ip });
      return jsonOk({ received: true });
    }

    const clean = {
      fullName: sanitizePlainText(payload.fullName),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone ? sanitizePlainText(payload.phone) : null,
      subject: sanitizePlainText(payload.subject),
      category: payload.category,
      message: sanitizePlainText(payload.message),
    };

    const fingerprint = createHash("sha256")
      .update(`${clean.email}|${clean.subject}|${clean.message}`)
      .digest("hex")
      .slice(0, 64);

    // Duplicate protection: identical message from the same sender within 10 minutes.
    const duplicate = await db
      .select({ id: contactMessages.id })
      .from(contactMessages)
      .where(
        and(
          eq(contactMessages.fingerprint, fingerprint),
          gt(contactMessages.createdAt, sql`now() - interval '10 minutes'`),
        ),
      )
      .limit(1);

    if (duplicate.length > 0) {
      return jsonOk({ received: true, duplicate: true });
    }

    const [record] = await db
      .insert(contactMessages)
      .values({ ...clean, fingerprint, status: "NEW" })
      .returning({ id: contactMessages.id });

    logger.info("Contact message stored", { messageId: record?.id, category: clean.category });

    return jsonOk({ received: true, id: record?.id }, { status: 201 });
  } catch (error) {
    return handleRouteError("contact.create", error);
  }
}
