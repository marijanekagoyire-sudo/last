import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const adminRoleEnum = pgEnum("admin_role", ["ADMIN", "EDITOR"]);
export const contentStatusEnum = pgEnum("content_status", ["DRAFT", "PUBLISHED"]);
export const messageStatusEnum = pgEnum("message_status", [
  "NEW",
  "READ",
  "REPLIED",
  "ARCHIVED",
]);
export const mediaTypeEnum = pgEnum("media_type", ["PHOTO", "VIDEO", "LIVESTREAM"]);

/* -------------------------------------------------------------------------- */
/* Administrators                                                              */
/* -------------------------------------------------------------------------- */

export const administrators = pgTable(
  "administrators",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    role: adminRoleEnum("role").notNull().default("ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("administrators_email_unique").on(table.email)],
);

/* -------------------------------------------------------------------------- */
/* Sessions (database backed, allows revocation)                               */
/* -------------------------------------------------------------------------- */

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    administratorId: integer("administrator_id")
      .notNull()
      .references(() => administrators.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    csrfToken: varchar("csrf_token", { length: 64 }).notNull(),
    userAgent: varchar("user_agent", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_unique").on(table.tokenHash),
    index("admin_sessions_admin_idx").on(table.administratorId),
    index("admin_sessions_expires_idx").on(table.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description").notNull(),
    eventDate: date("event_date").notNull(),
    startTime: varchar("start_time", { length: 10 }),
    endTime: varchar("end_time", { length: 10 }),
    location: varchar("location", { length: 200 }).notNull(),
    organizer: varchar("organizer", { length: 160 }),
    imageUrl: text("image_url"),
    registrationUrl: text("registration_url"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("events_slug_unique").on(table.slug),
    index("events_status_idx").on(table.status),
    index("events_event_date_idx").on(table.eventDate),
    index("events_published_at_idx").on(table.publishedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Announcements                                                               */
/* -------------------------------------------------------------------------- */

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("announcements_slug_unique").on(table.slug),
    index("announcements_status_idx").on(table.status),
    index("announcements_published_at_idx").on(table.publishedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Sermons                                                                     */
/* -------------------------------------------------------------------------- */

export const sermons = pgTable(
  "sermons",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    speaker: varchar("speaker", { length: 160 }).notNull(),
    scripture: varchar("scripture", { length: 200 }),
    description: text("description").notNull(),
    sermonDate: date("sermon_date").notNull(),
    audioUrl: text("audio_url"),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    category: varchar("category", { length: 80 }).notNull().default("General"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sermons_slug_unique").on(table.slug),
    index("sermons_status_idx").on(table.status),
    index("sermons_sermon_date_idx").on(table.sermonDate),
    index("sermons_category_idx").on(table.category),
  ],
);

/* -------------------------------------------------------------------------- */
/* Media library                                                               */
/* -------------------------------------------------------------------------- */

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    mediaType: mediaTypeEnum("media_type").notNull().default("PHOTO"),
    mediaUrl: text("media_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    category: varchar("category", { length: 80 }).notNull().default("Church Activities"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("media_slug_unique").on(table.slug),
    index("media_status_idx").on(table.status),
    index("media_category_idx").on(table.category),
    index("media_published_at_idx").on(table.publishedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Contact messages                                                            */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    subject: varchar("subject", { length: 200 }).notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    message: text("message").notNull(),
    status: messageStatusEnum("status").notNull().default("NEW"),
    fingerprint: varchar("fingerprint", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("contact_messages_status_idx").on(table.status),
    index("contact_messages_created_at_idx").on(table.createdAt),
    index("contact_messages_email_idx").on(table.email),
    index("contact_messages_fingerprint_idx").on(table.fingerprint),
  ],
);

/* -------------------------------------------------------------------------- */
/* Audit logs                                                                  */
/* -------------------------------------------------------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    administratorId: integer("administrator_id").references(() => administrators.id, {
      onDelete: "set null",
    }),
    administratorEmail: varchar("administrator_email", { length: 255 }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 60 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_admin_idx").on(table.administratorId),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                   */
/* -------------------------------------------------------------------------- */

export const administratorRelations = relations(administrators, ({ many }) => ({
  sessions: many(adminSessions),
  auditLogs: many(auditLogs),
}));

export const adminSessionRelations = relations(adminSessions, ({ one }) => ({
  administrator: one(administrators, {
    fields: [adminSessions.administratorId],
    references: [administrators.id],
  }),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  administrator: one(administrators, {
    fields: [auditLogs.administratorId],
    references: [administrators.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Inferred types                                                              */
/* -------------------------------------------------------------------------- */

export type Administrator = typeof administrators.$inferSelect;
export type EventRecord = typeof events.$inferSelect;
export type AnnouncementRecord = typeof announcements.$inferSelect;
export type SermonRecord = typeof sermons.$inferSelect;
export type MediaRecord = typeof media.$inferSelect;
export type ContactMessageRecord = typeof contactMessages.$inferSelect;
export type AuditLogRecord = typeof auditLogs.$inferSelect;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type MessageStatus = (typeof messageStatusEnum.enumValues)[number];
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
