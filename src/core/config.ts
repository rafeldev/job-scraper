import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import type { AppConfig } from "./interfaces.js";

const siteSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  domain: z.string().min(1),
  startUrls: z.array(z.string().url()).min(1),
  maxPages: z.number().int().positive().max(10).default(3),
  selectors: z.object({
    card: z.array(z.string()).min(1),
    title: z.array(z.string()).min(1),
    company: z.array(z.string()).default([]),
    location: z.array(z.string()).default([]),
    salary: z.array(z.string()).default([]),
    link: z.array(z.string()).min(1),
    date: z.array(z.string()).default([]),
    description: z.array(z.string()).optional(),
    nextPage: z.array(z.string()).optional()
  })
});

const appConfigSchema = z.object({
  sites: z.array(siteSchema),
  filters: z.object({
    keywords: z.array(z.string()),
    locations: z.array(z.string()),
    modalities: z.array(z.string()),
    maxAgeHours: z.number().int().positive(),
    excludeCompanies: z.array(z.string())
  }),
  limits: z.object({
    maxResultsPerSite: z.number().int().positive(),
    timeoutMs: z.number().int().positive(),
    minDelayMs: z.number().int().positive(),
    maxDelayMs: z.number().int().positive(),
    maxRetries: z.number().int().nonnegative()
  }),
  exports: z.object({
    outputDir: z.string().min(1),
    formats: z.array(z.enum(["json", "csv", "xlsx"])).default(["json"])
  })
});

export function loadConfig(configPath = "config/sites.yaml"): AppConfig {
  const absolutePath = path.resolve(configPath);
  const rawFile = fs.readFileSync(absolutePath, "utf8");
  const parsed = parse(rawFile);
  return appConfigSchema.parse(parsed);
}
