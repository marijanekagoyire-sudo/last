import { and, asc, desc, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { ZodType } from "zod";
import { db } from "@/db";
import { announcements, events, media, sermons } from "@/db/schema";
import { HttpError } from "./api";
import { sanitizePlainText, sanitizeRichText } from "./sanitize";
import { uniqueSlug } from "./slug";
import type { ListQuery } from "./validation";
import {
  announcementSchema,
  announcementUpdateSchema,
  eventSchema,
  eventUpdateSchema,
  mediaSchema,
  mediaUpdateSchema,
  sermonSchema,
  sermonUpdateSchema,
} from "./validation";

export type ResourceKey = "events" | "announcements" | "sermons" | "media";

type ResourceDefinition = {
  key: ResourceKey;
  entityType: string;
  label: string;
  table: PgTable;
  columns: {
    id: AnyPgColumn;
    title: AnyPgColumn;
    slug: AnyPgColumn;
    status: AnyPgColumn;
    publishedAt: AnyPgColumn;
    deletedAt: AnyPgColumn;
    createdAt: AnyPgColumn;
    updatedAt: AnyPgColumn;
    category?: AnyPgColumn;
    date?: AnyPgColumn;
  };
  searchColumns: AnyPgColumn[];
  createSchema: ZodType;
  updateSchema: ZodType;
  /** Field-level sanitisation applied before persistence. */
  sanitize: (values: Record<string, unknown>) => Record<string, unknown>;
  publicOrder: SQL[];
  adminOrder: SQL[];
};

function cleanTextFields(
  values: Record<string, unknown>,
  richTextFields: string[] = [],
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") {
      output[key] = richTextFields.includes(key) ? sanitizeRichText(value) : sanitizePlainText(value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

export const RESOURCES: Record<ResourceKey, ResourceDefinition> = {
  events: {
    key: "events",
    entityType: "EVENT",
    label: "Event",
    table: events,
    columns: {
      id: events.id,
      title: events.title,
      slug: events.slug,
      status: events.status,
      publishedAt: events.publishedAt,
      deletedAt: events.deletedAt,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      date: events.eventDate,
    },
    searchColumns: [events.title, events.location, events.description],
    createSchema: eventSchema,
    updateSchema: eventUpdateSchema,
    sanitize: (values) => cleanTextFields(values),
    publicOrder: [asc(events.eventDate)],
    adminOrder: [desc(events.eventDate), desc(events.id)],
  },
  announcements: {
    key: "announcements",
    entityType: "ANNOUNCEMENT",
    label: "Announcement",
    table: announcements,
    columns: {
      id: announcements.id,
      title: announcements.title,
      slug: announcements.slug,
      status: announcements.status,
      publishedAt: announcements.publishedAt,
      deletedAt: announcements.deletedAt,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
    },
    searchColumns: [announcements.title, announcements.content],
    createSchema: announcementSchema,
    updateSchema: announcementUpdateSchema,
    sanitize: (values) => cleanTextFields(values, ["content"]),
    publicOrder: [desc(announcements.publishedAt), desc(announcements.createdAt)],
    adminOrder: [desc(announcements.createdAt)],
  },
  sermons: {
    key: "sermons",
    entityType: "SERMON",
    label: "Sermon",
    table: sermons,
    columns: {
      id: sermons.id,
      title: sermons.title,
      slug: sermons.slug,
      status: sermons.status,
      publishedAt: sermons.publishedAt,
      deletedAt: sermons.deletedAt,
      createdAt: sermons.createdAt,
      updatedAt: sermons.updatedAt,
      category: sermons.category,
      date: sermons.sermonDate,
    },
    searchColumns: [sermons.title, sermons.speaker, sermons.scripture, sermons.description],
    createSchema: sermonSchema,
    updateSchema: sermonUpdateSchema,
    sanitize: (values) => cleanTextFields(values),
    publicOrder: [desc(sermons.sermonDate), desc(sermons.id)],
    adminOrder: [desc(sermons.sermonDate), desc(sermons.id)],
  },
  media: {
    key: "media",
    entityType: "MEDIA",
    label: "Media item",
    table: media,
    columns: {
      id: media.id,
      title: media.title,
      slug: media.slug,
      status: media.status,
      publishedAt: media.publishedAt,
      deletedAt: media.deletedAt,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      category: media.category,
    },
    searchColumns: [media.title, media.description, media.category],
    createSchema: mediaSchema,
    updateSchema: mediaUpdateSchema,
    sanitize: (values) => cleanTextFields(values),
    publicOrder: [desc(media.publishedAt), desc(media.createdAt)],
    adminOrder: [desc(media.createdAt)],
  },
};

export type ListResult = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildFilters(
  def: ResourceDefinition,
  query: ListQuery,
  options: { adminView: boolean },
): SQL[] {
  const filters: SQL[] = [isNull(def.columns.deletedAt) as SQL];

  if (!options.adminView) {
    filters.push(eq(def.columns.status, "PUBLISHED") as SQL);
  } else if (query.status && ["DRAFT", "PUBLISHED"].includes(query.status)) {
    filters.push(eq(def.columns.status, query.status) as SQL);
  }

  if (query.search) {
    const term = `%${query.search.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    const searchClauses = def.searchColumns.map((column) => sql`${column} ILIKE ${term}`);
    const combined = or(...searchClauses);
    if (combined) filters.push(combined);
  }

  if (query.category && def.columns.category) {
    filters.push(eq(def.columns.category, query.category) as SQL);
  }

  if (def.key === "events" && def.columns.date) {
    if (query.scope === "upcoming") {
      filters.push(sql`${def.columns.date} >= CURRENT_DATE`);
    } else if (query.scope === "past") {
      filters.push(sql`${def.columns.date} < CURRENT_DATE`);
    }
  }

  return filters;
}

export async function listResource(
  key: ResourceKey,
  query: ListQuery,
  options: { adminView: boolean },
): Promise<ListResult> {
  const def = RESOURCES[key];
  const filters = buildFilters(def, query, options);
  const where = and(...filters);

  let order = options.adminView ? def.adminOrder : def.publicOrder;
  if (key === "events" && !options.adminView && query.scope === "past" && def.columns.date) {
    order = [desc(def.columns.date)];
  }

  const offset = (query.page - 1) * query.pageSize;

  const [rows, countRows] = await Promise.all([
    (db.select().from(def.table as any) as any)
      .where(where)
      .orderBy(...order)
      .limit(query.pageSize)
      .offset(offset),
    (db.select({ value: sql<number>`count(*)::int` }).from(def.table as any) as any).where(where),
  ]);

  const total = Number((countRows as { value: number }[])[0]?.value ?? 0);

  return {
    items: rows as Record<string, unknown>[],
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function findResource(
  key: ResourceKey,
  identifier: string,
  options: { adminView: boolean },
): Promise<Record<string, unknown> | null> {
  const def = RESOURCES[key];
  const numeric = Number(identifier);
  const matcher = Number.isInteger(numeric) && String(numeric) === identifier
    ? eq(def.columns.id, numeric)
    : eq(def.columns.slug, identifier);

  const filters: SQL[] = [isNull(def.columns.deletedAt) as SQL, matcher as SQL];
  if (!options.adminView) filters.push(eq(def.columns.status, "PUBLISHED") as SQL);

  const rows = await (db.select().from(def.table as any) as any)
    .where(and(...filters))
    .limit(1);

  return (rows as Record<string, unknown>[])[0] ?? null;
}

async function slugExists(def: ResourceDefinition, candidate: string): Promise<boolean> {
  const rows = await (db.select({ id: def.columns.id }).from(def.table as any) as any)
    .where(eq(def.columns.slug, candidate))
    .limit(1);
  return (rows as unknown[]).length > 0;
}

export async function createResource(
  key: ResourceKey,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const def = RESOURCES[key];
  const parsed = def.createSchema.parse(payload) as Record<string, unknown>;
  const values = def.sanitize(parsed);

  const title = String(values.title ?? "");
  values.slug = await uniqueSlug(title, (candidate) => slugExists(def, candidate));
  values.publishedAt = values.status === "PUBLISHED" ? new Date() : null;
  values.createdAt = new Date();
  values.updatedAt = new Date();

  const inserted = await (db.insert(def.table as any) as any).values(values).returning();
  const record = (inserted as Record<string, unknown>[])[0];
  if (!record) throw new HttpError(500, "Unable to save changes.");
  return record;
}

export async function updateResource(
  key: ResourceKey,
  id: number,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const def = RESOURCES[key];
  const existing = await findResource(key, String(id), { adminView: true });
  if (!existing) throw new HttpError(404, `${def.label} was not found.`);

  const parsed = def.updateSchema.parse(payload) as Record<string, unknown>;
  const values = def.sanitize(parsed);

  // Only persist fields the client actually sent. Without this, schema level
  // defaults (status, category, media type) would silently overwrite existing
  // values during partial updates.
  const providedKeys = new Set(
    payload && typeof payload === "object" ? Object.keys(payload as Record<string, unknown>) : [],
  );
  for (const key of Object.keys(values)) {
    if (!providedKeys.has(key)) delete values[key];
  }

  if (Object.keys(values).length === 0) {
    throw new HttpError(400, "No changes were provided.");
  }

  if (typeof values.title === "string" && values.title !== existing.title) {
    values.slug = await uniqueSlug(values.title, async (candidate) => {
      if (candidate === existing.slug) return false;
      return slugExists(def, candidate);
    });
  }

  if (values.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    values.publishedAt = new Date();
  } else if (values.status === "DRAFT" && existing.status !== "DRAFT") {
    values.publishedAt = null;
  }

  values.updatedAt = new Date();

  const updated = await (db.update(def.table as any) as any)
    .set(values)
    .where(eq(def.columns.id, id))
    .returning();

  const record = (updated as Record<string, unknown>[])[0];
  if (!record) throw new HttpError(404, `${def.label} was not found.`);
  return record;
}

/** Soft delete keeps history intact and prevents accidental data loss. */
export async function deleteResource(key: ResourceKey, id: number): Promise<Record<string, unknown>> {
  const def = RESOURCES[key];
  const existing = await findResource(key, String(id), { adminView: true });
  if (!existing) throw new HttpError(404, `${def.label} was not found.`);

  const deleted = await (db.update(def.table as any) as any)
    .set({ deletedAt: new Date(), status: "DRAFT", publishedAt: null, updatedAt: new Date() })
    .where(eq(def.columns.id, id))
    .returning();

  return (deleted as Record<string, unknown>[])[0] ?? existing;
}

export async function countResource(
  key: ResourceKey,
  options: { publishedOnly?: boolean; upcomingOnly?: boolean } = {},
): Promise<number> {
  const def = RESOURCES[key];
  const filters: SQL[] = [isNull(def.columns.deletedAt) as SQL];
  if (options.publishedOnly) filters.push(eq(def.columns.status, "PUBLISHED") as SQL);
  if (options.upcomingOnly && def.columns.date) {
    filters.push(sql`${def.columns.date} >= CURRENT_DATE`);
  }
  const rows = await (db.select({ value: sql<number>`count(*)::int` }).from(def.table as any) as any)
    .where(and(...filters));
  return Number((rows as { value: number }[])[0]?.value ?? 0);
}
