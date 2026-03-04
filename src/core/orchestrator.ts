import type { AppConfig } from "./interfaces.js";
import { createBrowser, createContext } from "./browser/browserFactory.js";
import { CircuitBreaker } from "./browser/circuitBreaker.js";
import { logger } from "./logger.js";
import { createScraperMap } from "../scrapers/index.js";
import { normalizeJob, passesFilters } from "./parsers/normalizer.js";
import type { NormalizedJob, RunStats, SiteStats } from "../types/job.js";
import { randomDelay } from "./utils/random.js";
import {
  createRun,
  deactivateMissingJobs,
  finishRun,
  persistJobs,
  registerError
} from "../db/repositories/jobsRepository.js";
import { syncNotionFromDb } from "../integrations/notion.js";
import { exportJobs } from "./exporter.js";

export async function runOrchestrator(config: AppConfig): Promise<RunStats> {
  const runId = await createRun();
  const startedAt = new Date();
  const runStats: RunStats = {
    runId,
    startedAt,
    totalFound: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalDeactivated: 0,
    totalErrors: 0,
    perSite: {}
  };

  const breaker = new CircuitBreaker(config.limits.maxRetries, 15 * 60 * 1000);
  const browser = await createBrowser();
  const context = await createContext(browser);
  const scraperMap = createScraperMap();
  const keptJobs: NormalizedJob[] = [];

  try {
    for (const site of config.sites.filter((s) => s.enabled)) {
      const stats: SiteStats = { found: 0, inserted: 0, updated: 0, deactivated: 0, errors: 0, durationMs: 0 };
      const siteStarted = Date.now();
      runStats.perSite[site.name] = stats;

      if (!breaker.canExecute(site.name)) {
        logger.warn("Circuit breaker open for site", { site: site.name });
        continue;
      }

      const scraper = scraperMap[site.name];
      if (!scraper) {
        logger.warn("No scraper registered for site", { site: site.name });
        continue;
      }

      try {
        const rawJobs = await scraper.scrape(context, site);
        stats.found = rawJobs.length;
        runStats.totalFound += rawJobs.length;

        const normalized = rawJobs
          .map((raw) => normalizeJob(raw, site.name))
          .filter((job) => passesFilters(job, config.filters))
          .slice(0, config.limits.maxResultsPerSite);

        keptJobs.push(...normalized);
        const persisted = await persistJobs(normalized, runId);
        stats.inserted = persisted.inserted;
        stats.updated = persisted.updated;
        runStats.totalInserted += persisted.inserted;
        runStats.totalUpdated += persisted.updated;
        breaker.recordSuccess(site.name);
      } catch (error) {
        stats.errors += 1;
        runStats.totalErrors += 1;
        breaker.recordFailure(site.name);
        await registerError(
          runId,
          site.name,
          "scrape",
          error instanceof Error ? error.message : String(error)
        );
        logger.error("Error processing site", {
          site: site.name,
          error: error instanceof Error ? error.stack ?? error.message : String(error)
        });
      } finally {
        stats.durationMs = Date.now() - siteStarted;
        await randomDelay(config.limits.minDelayMs, config.limits.maxDelayMs);
      }
    }

    runStats.totalDeactivated = await deactivateMissingJobs(
      Array.from(new Set(keptJobs.map((job) => job.canonicalId))),
      runId
    );

    exportJobs(keptJobs, {
      outputDir: config.exports.outputDir,
      formats: config.exports.formats,
      dateTag: new Date().toISOString().slice(0, 10)
    });
    await syncNotionFromDb({ sinceDays: 1 });
    await finishRun(runId, "success");
    runStats.finishedAt = new Date();
    return runStats;
  } catch (error) {
    await finishRun(runId, "failed");
    await registerError(runId, null, "orchestrator", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
