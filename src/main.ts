import dotenv from "dotenv";
import { loadConfig } from "./core/config.js";
import { runOrchestrator } from "./core/orchestrator.js";
import { logger } from "./core/logger.js";
import { db } from "./db/client.js";

dotenv.config({ quiet: true });

async function main(): Promise<void> {
  const startedAt = Date.now();
  logger.info("Starting Playwright job scraper pipeline");
  try {
    const config = loadConfig();
    const runStats = await runOrchestrator(config);
    logger.info("Scraper finished successfully", {
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      runId: runStats.runId,
      found: runStats.totalFound,
      inserted: runStats.totalInserted,
      updated: runStats.totalUpdated,
      deactivated: runStats.totalDeactivated,
      errors: runStats.totalErrors
    });
  } catch (error) {
    logger.error("Pipeline failed", {
      error: error instanceof Error ? error.stack ?? error.message : String(error)
    });
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
