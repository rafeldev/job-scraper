CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  total_found INT NOT NULL DEFAULT 0,
  total_inserted INT NOT NULL DEFAULT 0,
  total_updated INT NOT NULL DEFAULT 0,
  total_deactivated INT NOT NULL DEFAULT 0,
  total_errors INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  modality TEXT NOT NULL,
  salary_min_cop BIGINT,
  salary_max_cop BIGINT,
  salary_currency TEXT,
  salary_text TEXT,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  source_primary TEXT NOT NULL,
  source_job_id TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  posted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(active);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_technologies ON jobs USING GIN(technologies);

CREATE TABLE IF NOT EXISTS job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_job_id TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(job_id, site_name, source_url)
);

CREATE TABLE IF NOT EXISTS job_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  version_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_text TEXT,
  salary_min_cop BIGINT,
  salary_max_cop BIGINT,
  description TEXT NOT NULL,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, version_hash)
);

CREATE INDEX IF NOT EXISTS idx_job_versions_job_created ON job_versions(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS scrape_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE SET NULL,
  site_name TEXT,
  stage TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
