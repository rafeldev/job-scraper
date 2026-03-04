import type { BrowserContext } from "playwright";
import type { RawJob } from "../types/job.js";

export interface SiteConfig {
  name: string;
  enabled: boolean;
  priority: "high" | "medium" | "low";
  domain: string;
  startUrls: string[];
  maxPages: number;
  selectors: {
    card: string[];
    title: string[];
    company: string[];
    location: string[];
    salary: string[];
    link: string[];
    date: string[];
    description?: string[];
    nextPage?: string[];
  };
}

export interface FiltersConfig {
  keywords: string[];
  locations: string[];
  modalities: string[];
  maxAgeHours: number;
  excludeCompanies: string[];
}

export interface LimitsConfig {
  maxResultsPerSite: number;
  timeoutMs: number;
  minDelayMs: number;
  maxDelayMs: number;
  maxRetries: number;
}

export interface AppConfig {
  sites: SiteConfig[];
  filters: FiltersConfig;
  limits: LimitsConfig;
  exports: {
    outputDir: string;
    formats: Array<"json" | "csv" | "xlsx">;
  };
}

export interface ISiteScraper {
  readonly siteName: string;
  scrape(context: BrowserContext, siteConfig: SiteConfig): Promise<RawJob[]>;
}
