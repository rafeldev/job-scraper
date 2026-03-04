export interface RawJob {
  title: string;
  company?: string;
  location?: string;
  salary?: string;
  description?: string;
  url: string;
  postedAt?: string;
  modality?: string;
}

export interface NormalizedJob {
  canonicalId: string;
  title: string;
  company: string;
  location: string;
  modality: "remote" | "hybrid" | "onsite" | "unknown";
  salaryMinCop?: number;
  salaryMaxCop?: number;
  salaryCurrency?: string;
  salaryText: string;
  description: string;
  url: string;
  sourceSite: string;
  sourceJobId?: string;
  postedAt?: string;
  scrapedAt: string;
  technologies: string[];
  active: boolean;
}

export interface RunStats {
  runId: string;
  startedAt: Date;
  finishedAt?: Date;
  totalFound: number;
  totalInserted: number;
  totalUpdated: number;
  totalDeactivated: number;
  totalErrors: number;
  perSite: Record<string, SiteStats>;
}

export interface SiteStats {
  found: number;
  inserted: number;
  updated: number;
  deactivated: number;
  errors: number;
  durationMs: number;
}
