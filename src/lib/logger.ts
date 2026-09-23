type Level = "info" | "warn" | "error";

const REDACTED = "[redacted]";
const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "tokenhash",
  "secret",
  "authorization",
  "cookie",
  "databaseurl",
  "database_url",
  "csrf",
];

function scrub(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrub);
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? REDACTED : scrub(raw);
    }
    return output;
  }
  return value;
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? (scrub(context) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
