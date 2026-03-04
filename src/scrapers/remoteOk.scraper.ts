import type { BrowserContext } from "playwright";
import type { ISiteScraper, SiteConfig } from "../core/interfaces.js";
import type { RawJob } from "../types/job.js";
import { logger } from "../core/logger.js";

const REMOTEOK_API = "https://remoteok.com/api";
const FRONTEND_TAGS = [
  "frontend",
  "front-end",
  "react",
  "reactjs",
  "javascript",
  "typescript",
  "vue",
  "angular",
  "nextjs",
  "next.js",
  "css",
  "html",
  "ui",
  "front end"
];

interface RemoteOkJobItem {
  id?: string;
  epoch?: number;
  date?: string;
  company?: string;
  company_logo?: string;
  position?: string;
  description?: string;
  location?: string;
  url?: string;
  apply_url?: string;
  salary_min?: number;
  salary_max?: number;
  tags?: string[];
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function formatSalary(min?: number, max?: number): string {
  if (min != null && max != null && (min > 0 || max > 0)) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()} USD`;
  }
  if (min != null && min > 0) return `$${min.toLocaleString()}+ USD`;
  if (max != null && max > 0) return `Up to $${max.toLocaleString()} USD`;
  return "";
}

function hasFrontendTag(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;
  const lower = tags.map((t) => t.toLowerCase());
  return FRONTEND_TAGS.some((keyword) => lower.some((t) => t.includes(keyword) || keyword.includes(t)));
}

/**
 * Remote OK - Uses public JSON API (no browser).
 * Terms: link back to Remote OK and mention as source.
 * Filters jobs by frontend-related tags.
 */
export class RemoteOkScraper implements ISiteScraper {
  readonly siteName = "Remote OK";

  async scrape(_context: BrowserContext, _siteConfig: SiteConfig): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    try {
      const res = await fetch(REMOTEOK_API, {
        headers: { "User-Agent": "JobScraper/1.0 (remote job aggregator; link-back to remoteok.com)" }
      });
      if (!res.ok) throw new Error(`Remote OK API returned ${res.status}`);
      const data = (await res.json()) as unknown[];
      // First item is metadata; rest are jobs
      const items = Array.isArray(data) ? data.slice(1) : [];
      for (const item of items as RemoteOkJobItem[]) {
        if (!item?.position || !item?.url) continue;
        if (!hasFrontendTag(item.tags)) continue;
        jobs.push({
          title: (item.position ?? "").trim(),
          company: (item.company ?? "").trim() || undefined,
          location: (item.location ?? "Remote").trim(),
          salary: formatSalary(item.salary_min, item.salary_max) || undefined,
          description: item.description ? stripHtml(item.description) : undefined,
          url: item.url.startsWith("http") ? item.url : `https://remoteok.com${item.url}`,
          postedAt: item.date ?? undefined
        });
      }
      logger.info("Remote OK API fetched", { count: jobs.length });
    } catch (error) {
      logger.error("Remote OK fetch failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return jobs;
  }
}
