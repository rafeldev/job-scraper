import dotenv from "dotenv";
import { logger } from "../core/logger.js";
import { db } from "../db/client.js";
import { countActiveJobsFirstSeenInLastHours } from "../db/repositories/jobsRepository.js";
import { sendDiscordMessage } from "../integrations/discord.js";

dotenv.config({ quiet: true });

const DEFAULT_THRESHOLD = 20;
const DEFAULT_WINDOW_HOURS = 24;
const DEFAULT_TIMEZONE = "America/Bogota";

function getPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${name} value: "${raw}". It must be a positive integer.`);
  }
  return value;
}

function formatNowInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
}

async function main(): Promise<void> {
  const threshold = getPositiveIntEnv("DISCORD_ALERT_THRESHOLD", DEFAULT_THRESHOLD);
  const windowHours = getPositiveIntEnv("NOTIFY_WINDOW_HOURS", DEFAULT_WINDOW_HOURS);
  const timezone = process.env.NOTIFY_TIMEZONE?.trim() || DEFAULT_TIMEZONE;

  const total = await countActiveJobsFirstSeenInLastHours(windowHours);
  const formattedNow = formatNowInTimezone(timezone);

  await sendDiscordMessage(
    `Ofertas nuevas (ultimas ${windowHours}h): ${total}\nHora: ${formattedNow} (${timezone})`
  );

  const shouldAlert = total >= threshold;
  if (shouldAlert) {
    await sendDiscordMessage(`Alerta: umbral superado. ${total} ofertas nuevas en las ultimas ${windowHours}h (>= ${threshold}).`);
  }

  logger.info("Discord notification sent", {
    total,
    windowHours,
    threshold,
    timezone,
    alertSent: shouldAlert
  });
}

main()
  .catch((error) => {
    logger.error("Discord notification failed", {
      error: error instanceof Error ? error.stack ?? error.message : String(error)
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
