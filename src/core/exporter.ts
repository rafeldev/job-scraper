import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import type { NormalizedJob } from "../types/job.js";

interface ExportOptions {
  outputDir: string;
  formats: Array<"json" | "csv" | "xlsx">;
  dateTag: string;
}

/** Columnas para CSV/XLSX con nombre visible (incluye URL directa de la oferta). */
const EXPORT_HEADERS: { key: keyof NormalizedJob; header: string }[] = [
  { key: "title", header: "Título" },
  { key: "company", header: "Empresa" },
  { key: "location", header: "Ubicación" },
  { key: "modality", header: "Modalidad" },
  { key: "salaryText", header: "Salario" },
  { key: "sourceSite", header: "Sitio" },
  { key: "url", header: "Enlace directo" },
  { key: "postedAt", header: "Publicado" },
  { key: "technologies", header: "Tecnologías" },
  { key: "description", header: "Descripción" },
  { key: "canonicalId", header: "canonicalId" },
  { key: "salaryMinCop", header: "salaryMinCop" },
  { key: "salaryMaxCop", header: "salaryMaxCop" },
  { key: "salaryCurrency", header: "salaryCurrency" },
  { key: "sourceJobId", header: "sourceJobId" },
  { key: "scrapedAt", header: "scrapedAt" },
  { key: "active", header: "active" }
];

function jobToExportRow(job: NormalizedJob): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const { key, header } of EXPORT_HEADERS) {
    const v = job[key];
    row[header] = Array.isArray(v) ? v.join(" | ") : v;
  }
  return row;
}

export function exportJobs(jobs: NormalizedJob[], options: ExportOptions): void {
  const outputDir = path.resolve(options.outputDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const baseName = `jobs-${options.dateTag}`;
  if (options.formats.includes("json")) {
    fs.writeFileSync(path.join(outputDir, `${baseName}.json`), JSON.stringify(jobs, null, 2), "utf8");
  }
  if (options.formats.includes("csv")) {
    fs.writeFileSync(path.join(outputDir, `${baseName}.csv`), toCsv(jobs), "utf8");
  }
  if (options.formats.includes("xlsx")) {
    const rows = jobs.map(jobToExportRow);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "jobs");
    XLSX.writeFile(workbook, path.join(outputDir, `${baseName}.xlsx`));
  }
}

function toCsv(jobs: NormalizedJob[]): string {
  if (jobs.length === 0) return "";
  const headers = EXPORT_HEADERS.map((h) => h.header);
  const rows = [headers.join(",")];
  for (const job of jobs) {
    const row = jobToExportRow(job);
    const values = headers.map((h) => escapeCsvValue(formatCsvValue(row[h])));
    rows.push(values.join(","));
  }
  return `${rows.join("\n")}\n`;
}

function formatCsvValue(value: unknown): string {
  if (Array.isArray(value)) return value.join("|");
  if (value == null) return "";
  return String(value);
}

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}
