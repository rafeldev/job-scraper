import levenshtein from "fast-levenshtein";
import type { NormalizedJob } from "../../types/job.js";

export function isLikelyDuplicate(existingDescription: string, incomingDescription: string, threshold = 0.88): boolean {
  const current = normalizeText(existingDescription);
  const incoming = normalizeText(incomingDescription);
  if (!current || !incoming) return false;
  const distance = levenshtein.get(current, incoming);
  const similarity = 1 - distance / Math.max(current.length, incoming.length);
  return similarity >= threshold;
}

export function buildVersionFingerprint(job: NormalizedJob): string {
  return [
    job.title.toLowerCase(),
    job.company.toLowerCase(),
    job.location.toLowerCase(),
    (job.salaryText || "").toLowerCase(),
    normalizeText(job.description).slice(0, 1000)
  ].join("::");
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}
