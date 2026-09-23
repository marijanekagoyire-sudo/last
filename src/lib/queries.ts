import { and, asc, desc, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  auditLogs,
  contactMessages,
  events,
  media,
  sermons,
  type AnnouncementRecord,
  type EventRecord,
  type MediaRecord,
  type SermonRecord,
} from "@/db/schema";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function likeTerm(search?: string) {
  if (!search) return null;
  const trimmed = search.trim();
  if (!trimmed) return null;
  return `%${trimmed.replace(/[%_]/g, (m) => `\\${m}`)}%`;
}

/* --------------------------------- Events --------------------------------- */

export async function getPublicEvents(options: {
  scope?: "upcoming" | "past" | "all";
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<Paginated<EventRecord>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, options.pageSize ?? 9));
  const filters: SQL[] = [isNull(events.deletedAt) as SQL, eq(events.status, "PUBLISHED")];

  if (options.scope === "upcoming") filters.push(sql`${events.eventDate} >= CURRENT_DATE`);
  if (options.scope === "past") filters.push(sql`${events.eventDate} < CURRENT_DATE`);

  const term = likeTerm(options.search);
  if (term) {
    const clause = or(
      sql`${events.title} ILIKE ${term}`,
      sql`${events.location} ILIKE ${term}`,
      sql`${events.description} ILIKE ${term}`,
    );
    if (clause) filters.push(clause);
  }

  const where = and(...filters);
  const order = options.scope === "past" ? [desc(events.eventDate)] : [asc(events.eventDate)];

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: sql<number>`count(*)::int` }).from(events).where(where),
  ]);

  return paginate(items, Number(countRows[0]?.value ?? 0), page, pageSize);
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const rows = await db
    .select()
    .from(events)
    .where(and(isNull(events.deletedAt), eq(events.status, "PUBLISHED"), eq(events.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

/* ------------------------------ Announcements ------------------------------ */

export async function getPublicAnnouncements(options: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<Paginated<AnnouncementRecord>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, options.pageSize ?? 8));
  const filters: SQL[] = [
    isNull(announcements.deletedAt) as SQL,
    eq(announcements.status, "PUBLISHED"),
  ];

  const term = likeTerm(options.search);
  if (term) {
    const clause = or(
      sql`${announcements.title} ILIKE ${term}`,
      sql`${announcements.content} ILIKE ${term}`,
    );
    if (clause) filters.push(clause);
  }

  const where = and(...filters);
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(announcements)
      .where(where)
      .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: sql<number>`count(*)::int` }).from(announcements).where(where),
  ]);

  return paginate(items, Number(countRows[0]?.value ?? 0), page, pageSize);
}

export async function getAnnouncementBySlug(slug: string): Promise<AnnouncementRecord | null> {
  const rows = await db
    .select()
    .from(announcements)
    .where(
      and(
        isNull(announcements.deletedAt),
        eq(announcements.status, "PUBLISHED"),
        eq(announcements.slug, slug),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/* --------------------------------- Sermons --------------------------------- */

export async function getPublicSermons(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}): Promise<Paginated<SermonRecord>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, options.pageSize ?? 9));
  const filters: SQL[] = [isNull(sermons.deletedAt) as SQL, eq(sermons.status, "PUBLISHED")];

  const term = likeTerm(options.search);
  if (term) {
    const clause = or(
      sql`${sermons.title} ILIKE ${term}`,
      sql`${sermons.speaker} ILIKE ${term}`,
      sql`${sermons.scripture} ILIKE ${term}`,
      sql`${sermons.description} ILIKE ${term}`,
    );
    if (clause) filters.push(clause);
  }
  if (options.category && options.category !== "All") {
    filters.push(eq(sermons.category, options.category));
  }

  const where = and(...filters);
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(sermons)
      .where(where)
      .orderBy(desc(sermons.sermonDate), desc(sermons.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: sql<number>`count(*)::int` }).from(sermons).where(where),
  ]);

  return paginate(items, Number(countRows[0]?.value ?? 0), page, pageSize);
}

export async function getSermonBySlug(slug: string): Promise<SermonRecord | null> {
  const rows = await db
    .select()
    .from(sermons)
    .where(and(isNull(sermons.deletedAt), eq(sermons.status, "PUBLISHED"), eq(sermons.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

/* ---------------------------------- Media ---------------------------------- */

export async function getPublicMedia(options: {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}): Promise<Paginated<MediaRecord>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(36, Math.max(1, options.pageSize ?? 12));
  const filters: SQL[] = [isNull(media.deletedAt) as SQL, eq(media.status, "PUBLISHED")];

  if (options.category && options.category !== "All") {
    filters.push(eq(media.category, options.category));
  }
  const term = likeTerm(options.search);
  if (term) {
    const clause = or(sql`${media.title} ILIKE ${term}`, sql`${media.description} ILIKE ${term}`);
    if (clause) filters.push(clause);
  }

  const where = and(...filters);
  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.publishedAt), desc(media.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: sql<number>`count(*)::int` }).from(media).where(where),
  ]);

  return paginate(items, Number(countRows[0]?.value ?? 0), page, pageSize);
}

/* -------------------------------- Home page -------------------------------- */

export type HomeData = {
  upcomingEvents: EventRecord[];
  announcements: AnnouncementRecord[];
  sermons: SermonRecord[];
  media: MediaRecord[];
};

export async function getHomeData(): Promise<HomeData> {
  const [upcomingEvents, latestAnnouncements, latestSermons, latestMedia] = await Promise.all([
    db
      .select()
      .from(events)
      .where(
        and(
          isNull(events.deletedAt),
          eq(events.status, "PUBLISHED"),
          sql`${events.eventDate} >= CURRENT_DATE`,
        ),
      )
      .orderBy(asc(events.eventDate))
      .limit(3),
    db
      .select()
      .from(announcements)
      .where(and(isNull(announcements.deletedAt), eq(announcements.status, "PUBLISHED")))
      .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
      .limit(3),
    db
      .select()
      .from(sermons)
      .where(and(isNull(sermons.deletedAt), eq(sermons.status, "PUBLISHED")))
      .orderBy(desc(sermons.sermonDate))
      .limit(3),
    db
      .select()
      .from(media)
      .where(and(isNull(media.deletedAt), eq(media.status, "PUBLISHED")))
      .orderBy(desc(media.publishedAt), desc(media.createdAt))
      .limit(6),
  ]);

  return {
    upcomingEvents,
    announcements: latestAnnouncements,
    sermons: latestSermons,
    media: latestMedia,
  };
}

/* ------------------------------ Admin dashboard ---------------------------- */

export type DashboardStats = {
  totalEvents: number;
  upcomingEvents: number;
  publishedEvents: number;
  totalAnnouncements: number;
  totalSermons: number;
  totalMedia: number;
  newMessages: number;
  totalMessages: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM events WHERE deleted_at IS NULL) AS total_events,
      (SELECT count(*)::int FROM events WHERE deleted_at IS NULL AND event_date >= CURRENT_DATE) AS upcoming_events,
      (SELECT count(*)::int FROM events WHERE deleted_at IS NULL AND status = 'PUBLISHED') AS published_events,
      (SELECT count(*)::int FROM announcements WHERE deleted_at IS NULL) AS total_announcements,
      (SELECT count(*)::int FROM sermons WHERE deleted_at IS NULL) AS total_sermons,
      (SELECT count(*)::int FROM media WHERE deleted_at IS NULL) AS total_media,
      (SELECT count(*)::int FROM contact_messages WHERE status = 'NEW') AS new_messages,
      (SELECT count(*)::int FROM contact_messages WHERE status <> 'ARCHIVED') AS total_messages
  `);

  const row = (rows.rows[0] ?? {}) as Record<string, number | string | null>;
  const num = (key: string) => Number(row[key] ?? 0);

  return {
    totalEvents: num("total_events"),
    upcomingEvents: num("upcoming_events"),
    publishedEvents: num("published_events"),
    totalAnnouncements: num("total_announcements"),
    totalSermons: num("total_sermons"),
    totalMedia: num("total_media"),
    newMessages: num("new_messages"),
    totalMessages: num("total_messages"),
  };
}

export async function getRecentActivity(limit = 8) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      administratorEmail: auditLogs.administratorEmail,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getUnreadMessageCount(): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(eq(contactMessages.status, "NEW"));
  return Number(rows[0]?.value ?? 0);
}
