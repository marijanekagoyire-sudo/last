const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}${/^\d{4}-\d{2}-\d{2}$/.test(value) ? "T00:00:00Z" : ""}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_FORMATTER.format(date) : "—";
}

export function formatLongDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? LONG_DATE_FORMATTER.format(date) : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : "—";
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  const hourNumber = Number(hours);
  if (Number.isNaN(hourNumber)) return value;
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const normalized = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  return `${normalized}:${minutes ?? "00"} ${suffix}`;
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "Time to be announced";
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
  return formatTime(start ?? end ?? "");
}

export function isUpcoming(dateValue: string | Date | null | undefined): boolean {
  const date = toDate(dateValue);
  if (!date) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}
