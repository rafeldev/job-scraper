import fs from "node:fs";
import path from "node:path";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOG_DIR, `scraper-${new Date().toISOString().slice(0, 10)}.log`);

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  ensureLogDir();
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    message,
    context
  };
  const serialized = JSON.stringify(entry);
  fs.appendFileSync(LOG_FILE, `${serialized}\n`, "utf8");
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context)
};
