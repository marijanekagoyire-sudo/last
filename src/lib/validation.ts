import { z } from "zod";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const optionalUrl = z.preprocess(
  emptyToNull,
  z
    .url({ message: "Enter a valid URL starting with http:// or https://" })
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://")
    .nullable()
    .optional(),
);

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD");

const optionalTime = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour format HH:MM")
    .nullable()
    .optional(),
);

export const contentStatus = z.enum(["DRAFT", "PUBLISHED"]);

/* ----------------------------------- Auth --------------------------------- */

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }).max(255),
  password: z.string().min(1, "Password is required.").max(200),
});

export const strongPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200)
  .refine((value) => /[a-z]/.test(value), "Include a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Include an uppercase letter.")
  .refine((value) => /\d/.test(value), "Include a number.")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Include a symbol.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password different from the current one.",
    path: ["newPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(160),
  email: z.email({ message: "Enter a valid email address." }).max(255),
});

/* ---------------------------------- Events -------------------------------- */

export const eventSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(20000),
  eventDate: dateString,
  startTime: optionalTime,
  endTime: optionalTime,
  location: z.string().trim().min(2, "Location is required.").max(200),
  organizer: optionalText(160),
  imageUrl: optionalUrl,
  registrationUrl: optionalUrl,
  status: contentStatus.default("DRAFT"),
});

export const eventUpdateSchema = eventSchema.partial();

/* ------------------------------ Announcements ----------------------------- */

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  content: z.string().trim().min(10, "Content must be at least 10 characters.").max(40000),
  imageUrl: optionalUrl,
  status: contentStatus.default("DRAFT"),
});

export const announcementUpdateSchema = announcementSchema.partial();

/* --------------------------------- Sermons -------------------------------- */

export const sermonSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  speaker: z.string().trim().min(2, "Speaker is required.").max(160),
  scripture: optionalText(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(20000),
  sermonDate: dateString,
  audioUrl: optionalUrl,
  videoUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  category: z.string().trim().min(2).max(80).default("General"),
  status: contentStatus.default("DRAFT"),
});

export const sermonUpdateSchema = sermonSchema.partial();

/* ---------------------------------- Media --------------------------------- */

export const mediaTypeValues = z.enum(["PHOTO", "VIDEO", "LIVESTREAM"]);

export const mediaSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  description: optionalText(4000),
  mediaType: mediaTypeValues.default("PHOTO"),
  mediaUrl: z
    .url({ message: "Enter a valid media URL." })
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://"),
  thumbnailUrl: optionalUrl,
  category: z.string().trim().min(2).max(80).default("Church Activities"),
  status: contentStatus.default("DRAFT"),
});

export const mediaUpdateSchema = mediaSchema.partial();

/* --------------------------------- Contact -------------------------------- */

export const contactCategories = [
  "General inquiry",
  "Prayer request",
  "Counseling",
  "Membership",
  "Event inquiry",
  "Partnership",
  "Volunteering",
  "Donation inquiry",
  "Testimony",
  "Other",
] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(160),
  email: z.email({ message: "Enter a valid email address." }).max(255),
  phone: optionalText(40),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(200),
  category: z.enum(contactCategories),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(4000),
  // Honeypot: real users never fill this in.
  website: z.string().max(200).optional().default(""),
});

export const messageUpdateSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]),
});

/* ------------------------------- List queries ------------------------------ */

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(20).optional(),
  category: z.string().trim().max(80).optional(),
  scope: z.string().trim().max(20).optional(),
  sort: z.string().trim().max(30).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
