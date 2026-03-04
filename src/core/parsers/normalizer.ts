import crypto from "node:crypto";
import type { FiltersConfig } from "../interfaces.js";
import type { NormalizedJob, RawJob } from "../../types/job.js";

const TECHS = ["react", "typescript", "javascript", "next.js", "vue", "angular", "node"];

export function normalizeJob(raw: RawJob, sourceSite: string): NormalizedJob {
  const title = sanitize(raw.title, 150);
  const company = sanitize(raw.company ?? "No especificada", 120);
  const location = sanitize(raw.location ?? "No especificada", 120);
  const description = sanitize(raw.description ?? "", 4000);
  const technologies = detectTechnologies(`${title} ${description}`);
  const modality = detectModality(`${title} ${description} ${location}`);
  const salary = parseSalary(raw.salary ?? description);
  const canonicalId = createCanonicalId(title, company, location);

  return {
    canonicalId,
    title,
    company,
    location,
    modality,
    salaryMinCop: salary.minCop,
    salaryMaxCop: salary.maxCop,
    salaryCurrency: salary.currency,
    salaryText: sanitize(raw.salary ?? "No especificado", 180),
    description,
    url: raw.url,
    sourceSite,
    sourceJobId: extractSourceJobId(raw.url),
    postedAt: parsePostedDate(raw.postedAt),
    scrapedAt: new Date().toISOString(),
    technologies,
    active: true
  };
}

export function passesFilters(job: NormalizedJob, filters: FiltersConfig): boolean {
  const searchableText = `${job.title} ${job.description}`.toLowerCase();
  const hasKeyword = filters.keywords.some((kw) => searchableText.includes(kw.toLowerCase()));
  if (!hasKeyword) return false;

  const excluded = filters.excludeCompanies.some((c) => job.company.toLowerCase().includes(c.toLowerCase()));
  if (excluded) return false;

  const locationOk =
    filters.locations.length === 0 ||
    filters.locations.some((loc) => `${job.location} ${job.description}`.toLowerCase().includes(loc.toLowerCase()));
  if (!locationOk) return false;

  if (job.postedAt) {
    const maxAgeMs = filters.maxAgeHours * 60 * 60 * 1000;
    const ageMs = Date.now() - new Date(job.postedAt).getTime();
    if (Number.isFinite(ageMs) && ageMs > maxAgeMs) return false;
  }

  return true;
}

function detectTechnologies(input: string): string[] {
  const normalized = input.toLowerCase();
  return TECHS.filter((tech) => normalized.includes(tech));
}

function detectModality(input: string): "remote" | "hybrid" | "onsite" | "unknown" {
  const text = input.toLowerCase();
  if (/(remote|remoto|work from home|teletrabajo)/.test(text)) return "remote";
  if (/(h[ií]brido|hybrid)/.test(text)) return "hybrid";
  if (/(presencial|on-site|onsite)/.test(text)) return "onsite";
  return "unknown";
}

function parseSalary(input: string): { minCop?: number; maxCop?: number; currency?: string } {
  const text = input.toLowerCase().replace(/\./g, "").replace(/,/g, ".");
  const currency = text.includes("usd") ? "USD" : "COP";
  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)/g)).map((m) => Number(m[1]));
  if (matches.length === 0) return {};
  const [first, second] = matches;
  return {
    minCop: scaleValue(first),
    maxCop: scaleValue(second),
    currency
  };
}

function scaleValue(value?: number): number | undefined {
  if (!value) return undefined;
  if (value < 1000) return Math.round(value * 1_000_000);
  return Math.round(value);
}

function extractSourceJobId(url: string): string | undefined {
  const match = url.match(/(?:\/|=)(\d{5,})/);
  return match?.[1];
}

function sanitize(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function createCanonicalId(title: string, company: string, location: string): string {
  const payload = `${title.toLowerCase()}::${company.toLowerCase()}::${location.toLowerCase()}`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

/** Parsea fechas relativas en español (e.g. "Hace 3 horas", "Hace 4 días") a ISO. Devuelve undefined si no es parseable. */
export function parsePostedDate(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return `${s.slice(0, 10)}T00:00:00.000Z`;

  const text = s.toLowerCase();

  const now = Date.now();
  const horas = text.match(/(?:hace|publicado hace)\s*(\d+)\s*(?:hora|horas)/);
  if (horas) {
    const d = new Date(now - Number(horas[1]) * 60 * 60 * 1000);
    return d.toISOString();
  }
  const dias = text.match(/(?:hace|publicado hace)\s*(\d+)\s*(?:d[ií]a|d[ií]as)/);
  if (dias) {
    const d = new Date(now - Number(dias[1]) * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  const semanas = text.match(/(?:hace|publicado hace)\s*(\d+)\s*(?:semana|semanas)/);
  if (semanas) {
    const d = new Date(now - Number(semanas[1]) * 7 * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  const meses = text.match(/(?:hace|publicado hace)\s*(\d+)\s*(?:mes|meses)/);
  if (meses) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - Number(meses[1]));
    return d.toISOString();
  }
  if (/(?:publicado\s+)?hoy|today/.test(text)) {
    return new Date(now).toISOString();
  }
  if (/ayer|yesterday/.test(text)) {
    const d = new Date(now - 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  return undefined;
}
