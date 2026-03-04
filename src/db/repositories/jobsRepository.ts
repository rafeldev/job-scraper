import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { db } from "../client.js";
import { buildVersionFingerprint, isLikelyDuplicate } from "../../core/parsers/dedupe.js";
import type { NormalizedJob } from "../../types/job.js";

/** Solo valores que PostgreSQL acepta como TIMESTAMPTZ (ISO o null). */
function safePostedAt(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value.trim())) return value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(value.trim())) return value.trim();
  return null;
}

export interface PersistResult {
  inserted: number;
  updated: number;
}

/** Job tal como se lee de la DB para sincronizar a Notion (por día de first_seen_at). */
export interface JobForNotion {
  id: string;
  title: string;
  company: string;
  location: string;
  modality: string;
  salaryText: string | null;
  url: string;
  sourceSite: string;
  technologies: string[];
}

/** Devuelve jobs activos cuyo first_seen_at cae en la fecha dada (UTC). date = YYYY-MM-DD. */
export async function getJobsByFirstSeenDate(date: string): Promise<JobForNotion[]> {
  const result = await db.query(
    `SELECT id, title, company, location, modality, salary_text, url, source_primary, technologies
     FROM jobs
     WHERE first_seen_at >= $1::date AND first_seen_at < $1::date + interval '1 day'
       AND active = true
     ORDER BY first_seen_at ASC`,
    [date]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    title: r.title,
    company: r.company,
    location: r.location,
    modality: r.modality,
    salaryText: r.salary_text ?? null,
    url: r.url,
    sourceSite: r.source_primary,
    technologies: Array.isArray(r.technologies) ? r.technologies : []
  })) as JobForNotion[];
}

/** Cuenta jobs activos vistos por primera vez en las últimas N horas. */
export async function countActiveJobsFirstSeenInLastHours(hours: number): Promise<number> {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("hours must be a positive number.");
  }
  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM jobs
     WHERE active = true
       AND first_seen_at >= NOW() - ($1::int * INTERVAL '1 hour')`,
    [Math.floor(hours)]
  );
  return (result.rows[0]?.total as number | undefined) ?? 0;
}

export async function persistJobs(jobs: NormalizedJob[], runId: string): Promise<PersistResult> {
  let inserted = 0;
  let updated = 0;
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const job of jobs) {
      const result = await upsertJob(client, job);
      if (result === "inserted") inserted += 1;
      if (result === "updated") updated += 1;
      await upsertSource(client, job);
    }
    await client.query(
      `UPDATE scrape_runs
       SET total_inserted = total_inserted + $1,
           total_updated = total_updated + $2,
           total_found = total_found + $3
       WHERE id = $4`,
      [inserted, updated, jobs.length, runId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { inserted, updated };
}

export async function deactivateMissingJobs(seenCanonicalIds: string[], runId: string): Promise<number> {
  const result = await db.query(
    `UPDATE jobs
     SET active = false, updated_at = NOW()
     WHERE active = true
       AND canonical_id <> ALL($1::text[])
       AND last_seen_at < NOW() - INTERVAL '48 hours'`,
    [seenCanonicalIds]
  );
  await db.query("UPDATE scrape_runs SET total_deactivated = $1 WHERE id = $2", [result.rowCount, runId]);
  return result.rowCount ?? 0;
}

export async function createRun(): Promise<string> {
  const result = await db.query("INSERT INTO scrape_runs DEFAULT VALUES RETURNING id");
  return result.rows[0].id as string;
}

export async function finishRun(runId: string, status: "success" | "failed"): Promise<void> {
  await db.query("UPDATE scrape_runs SET status = $1, finished_at = NOW() WHERE id = $2", [status, runId]);
}

export async function registerError(
  runId: string,
  siteName: string | null,
  stage: string,
  message: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await db.query(
    `INSERT INTO scrape_errors(run_id, site_name, stage, message, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [runId, siteName, stage, message, JSON.stringify(details)]
  );
  await db.query("UPDATE scrape_runs SET total_errors = total_errors + 1 WHERE id = $1", [runId]);
}

async function upsertJob(client: PoolClient, job: NormalizedJob): Promise<"inserted" | "updated" | "unchanged"> {
  const existing = await client.query(
    `SELECT id, description, salary_text
     FROM jobs
     WHERE canonical_id = $1
     LIMIT 1`,
    [job.canonicalId]
  );

  if (existing.rowCount === 0) {
    const inserted = await client.query(
      `INSERT INTO jobs(
        canonical_id, title, company, location, modality, salary_min_cop, salary_max_cop,
        salary_currency, salary_text, description, url, source_primary, source_job_id,
        technologies, posted_at, first_seen_at, last_seen_at, active, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW(),true,NOW(),NOW()
      )
      RETURNING id`,
      [
        job.canonicalId,
        job.title,
        job.company,
        job.location,
        job.modality,
        job.salaryMinCop ?? null,
        job.salaryMaxCop ?? null,
        job.salaryCurrency ?? null,
        job.salaryText,
        job.description,
        job.url,
        job.sourceSite,
        job.sourceJobId ?? null,
        job.technologies,
        safePostedAt(job.postedAt)
      ]
    );
    await insertVersion(client, inserted.rows[0].id as string, job, ["initial"]);
    return "inserted";
  }

  const row = existing.rows[0] as { id: string; description: string; salary_text: string | null };
  const changedFields: string[] = [];
  if (row.salary_text !== job.salaryText) changedFields.push("salary");
  if (!isLikelyDuplicate(row.description, job.description)) changedFields.push("description");

  await client.query(
    `UPDATE jobs
     SET title = $1,
         company = $2,
         location = $3,
         modality = $4,
         salary_min_cop = $5,
         salary_max_cop = $6,
         salary_currency = $7,
         salary_text = $8,
         description = $9,
         url = $10,
         source_job_id = $11,
         technologies = $12,
         posted_at = COALESCE($13, posted_at),
         active = true,
         last_seen_at = NOW(),
         updated_at = NOW()
     WHERE id = $14`,
    [
      job.title,
      job.company,
      job.location,
      job.modality,
      job.salaryMinCop ?? null,
      job.salaryMaxCop ?? null,
      job.salaryCurrency ?? null,
      job.salaryText,
      job.description,
      job.url,
      job.sourceJobId ?? null,
      job.technologies,
      safePostedAt(job.postedAt),
      row.id
    ]
  );

  if (changedFields.length > 0) {
    await insertVersion(client, row.id, job, changedFields);
    return "updated";
  }
  return "unchanged";
}

async function insertVersion(client: PoolClient, jobId: string, job: NormalizedJob, changedFields: string[]): Promise<void> {
  const versionHash = crypto.createHash("sha256").update(buildVersionFingerprint(job)).digest("hex");
  await client.query(
    `INSERT INTO job_versions(
      job_id, version_hash, title, company, location, salary_text, salary_min_cop, salary_max_cop, description, changed_fields
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (job_id, version_hash) DO NOTHING`,
    [
      jobId,
      versionHash,
      job.title,
      job.company,
      job.location,
      job.salaryText,
      job.salaryMinCop ?? null,
      job.salaryMaxCop ?? null,
      job.description,
      changedFields
    ]
  );
}

async function upsertSource(client: PoolClient, job: NormalizedJob): Promise<void> {
  await client.query(
    `INSERT INTO job_sources(job_id, site_name, source_url, source_job_id)
     SELECT id, $2, $3, $4
     FROM jobs
     WHERE canonical_id = $1
     ON CONFLICT(job_id, site_name, source_url)
     DO UPDATE SET
       source_job_id = EXCLUDED.source_job_id,
       last_seen_at = NOW(),
       active = true`,
    [job.canonicalId, job.sourceSite, job.url, job.sourceJobId ?? null]
  );
}
