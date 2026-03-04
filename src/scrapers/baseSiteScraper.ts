import type { BrowserContext, Locator, Page } from "playwright";
import type { ISiteScraper, SiteConfig } from "../core/interfaces.js";
import type { RawJob } from "../types/job.js";
import { logger } from "../core/logger.js";
import { simulateHumanBehavior } from "../core/browser/humanBehavior.js";
import { throttleDomain } from "../core/browser/rateLimiter.js";

export abstract class BaseSiteScraper implements ISiteScraper {
  abstract readonly siteName: string;

  async scrape(context: BrowserContext, siteConfig: SiteConfig): Promise<RawJob[]> {
    const page = await context.newPage();
    const jobs: RawJob[] = [];
    try {
      for (const startUrl of siteConfig.startUrls) {
        await throttleDomain(siteConfig.domain, 1000);
        await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);
        await simulateHumanBehavior(page, 1200, 2800);
        const scraped = await this.scrapeListingPages(page, siteConfig);
        jobs.push(...scraped);
      }
    } catch (error) {
      logger.error("Site scrape failed", {
        site: this.siteName,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      await page.close();
    }
    return dedupeByUrl(jobs);
  }

  private async scrapeListingPages(page: Page, config: SiteConfig): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    for (let pageNumber = 1; pageNumber <= config.maxPages; pageNumber += 1) {
      await page.waitForLoadState("domcontentloaded");
      const cards = await firstWorkingLocator(page, config.selectors.card);
      if (!cards) {
        logger.warn("No card selector matched", { site: this.siteName, pageNumber });
        break;
      }

      const count = await cards.count();
      for (let i = 0; i < count; i += 1) {
        const card = cards.nth(i);
        const job = await parseCard(card, config);
        if (job?.url && job.title) jobs.push(job);
      }

      const moved = await this.goNextPage(page, config);
      if (!moved) break;
      await simulateHumanBehavior(page, 1200, 2500);
    }
    return jobs;
  }

  private async goNextPage(page: Page, config: SiteConfig): Promise<boolean> {
    const selectors = config.selectors.nextPage ?? [];
    for (const selector of selectors) {
      const button = page.locator(selector).first();
      if ((await button.count()) === 0) continue;
      if (!(await button.isVisible())) continue;
      await Promise.all([
        page.waitForLoadState("domcontentloaded"),
        button.click({ timeout: 6000 })
      ]);
      return true;
    }
    return false;
  }
}

async function parseCard(card: Locator, config: SiteConfig): Promise<RawJob | null> {
  const title = await getFirstText(card, config.selectors.title);
  const url = await getFirstAttr(card, config.selectors.link, "href");
  if (!url || !title) return null;
  const company = await getFirstText(card, config.selectors.company);
  const location = await getFirstText(card, config.selectors.location);
  const salary = await getFirstText(card, config.selectors.salary);
  const postedAt = await getFirstText(card, config.selectors.date);
  const description = await getFirstText(card, config.selectors.description ?? []);

  return {
    title,
    company,
    location,
    salary,
    postedAt,
    description,
    url: normalizeUrl(url)
  };
}

async function firstWorkingLocator(page: Page, selectors: string[]): Promise<Locator | null> {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    if ((await loc.count()) > 0) return loc;
  }
  return null;
}

async function getFirstText(scope: Locator, selectors: string[]): Promise<string | undefined> {
  for (const selector of selectors) {
    const candidate = scope.locator(selector).first();
    if ((await candidate.count()) === 0) continue;
    const value = (await candidate.innerText()).trim();
    if (value) return value;
  }
  return undefined;
}

async function getFirstAttr(scope: Locator, selectors: string[], attr: string): Promise<string | undefined> {
  for (const selector of selectors) {
    const candidate = scope.locator(selector).first();
    if ((await candidate.count()) === 0) continue;
    const value = await candidate.getAttribute(attr);
    if (value) return value.trim();
  }
  return undefined;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function dedupeByUrl(jobs: RawJob[]): RawJob[] {
  const byUrl = new Map<string, RawJob>();
  for (const job of jobs) byUrl.set(job.url, job);
  return Array.from(byUrl.values());
}
