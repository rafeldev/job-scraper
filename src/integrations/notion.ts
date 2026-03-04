import dotenv from "dotenv";
import { Client } from "@notionhq/client";
import type { NormalizedJob } from "../types/job.js";
import { getJobsByFirstSeenDate, type JobForNotion } from "../db/repositories/jobsRepository.js";

dotenv.config({ quiet: true });

const notionToken = process.env.NOTION_API_KEY;
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
const notionEnabled = process.env.NOTION_SYNC_ENABLED === "true";
const notionTimezone = process.env.NOTION_TIMEZONE?.trim() || "UTC";

const NOTION_DB_TITLE_PREFIX = "Ofertas de Trabajo - ";
const RATE_LIMIT_MS = 350;

const notion = notionToken ? new Client({ auth: notionToken }) : null;

function buildNotionProperties(job: JobForNotion | NormalizedJob) {
  const salaryText =
    "salaryText" in job ? (job.salaryText ?? "") : (job as NormalizedJob).salaryText ?? "";
  const sourceSite = "sourceSite" in job ? job.sourceSite : (job as NormalizedJob).sourceSite;
  const technologies = Array.isArray((job as JobForNotion).technologies)
    ? (job as JobForNotion).technologies.join(", ")
    : ((job as NormalizedJob).technologies ?? []).join(", ");

  return {
    Título: { title: [{ text: { content: job.title.slice(0, 2000) } }] },
    Empresa: { rich_text: [{ text: { content: job.company.slice(0, 2000) } }] },
    Ubicación: { rich_text: [{ text: { content: job.location.slice(0, 2000) } }] },
    Modalidad: { rich_text: [{ text: { content: job.modality } }] },
    Salario: { rich_text: [{ text: { content: salaryText.slice(0, 2000) } }] },
    Sitio: { rich_text: [{ text: { content: sourceSite } }] },
    Tecnologías: { rich_text: [{ text: { content: technologies.slice(0, 2000) } }] },
    "Enlace directo": { url: job.url || undefined }
  } as Parameters<Client["pages"]["create"]>[0]["properties"];
}

/** Sincronización legacy: envía los jobs del run actual (sin leer de la DB). */
export async function maybeSyncToNotion(jobs: NormalizedJob[]): Promise<void> {
  if (!notionEnabled || !notion || !parentPageId || jobs.length === 0) return;
  const date = new Date().toISOString().slice(0, 10);
  const dbId = await getOrCreateDatabaseForDate(date);
  for (const job of jobs) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: buildNotionProperties(job as unknown as JobForNotion)
    });
    await sleep(RATE_LIMIT_MS);
  }
}

/** Obtiene o crea la base de datos en Notion para la fecha (tabla por día). */
export async function getOrCreateDatabaseForDate(date: string): Promise<string> {
  if (!notion || !parentPageId) throw new Error("Notion no configurado: NOTION_API_KEY y NOTION_PARENT_PAGE_ID.");
  const title = `${NOTION_DB_TITLE_PREFIX}${date}`;
  const search = await notion.search({
    query: title,
    filter: { property: "object", value: "database" },
    page_size: 10
  });
  for (const item of search.results) {
    if (item.object !== "database") continue;
    const parent = "parent" in item ? (item as { parent: { type?: string; page_id?: string } }).parent : undefined;
    if (parent?.type === "page_id" && parent.page_id === parentPageId) return item.id;
  }
  const created = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: title } }],
    properties: {
      Título: { title: {} },
      Empresa: { rich_text: {} },
      Ubicación: { rich_text: {} },
      Modalidad: { rich_text: {} },
      Salario: { rich_text: {} },
      Sitio: { rich_text: {} },
      Tecnologías: { rich_text: {} },
      "Enlace directo": { url: {} }
    }
  });
  return created.id;
}

/** Extrae la URL de la propiedad "Enlace directo" o "Link" (bases antiguas) de una página de Notion. */
function getUrlFromPage(page: { properties?: Record<string, { type?: string; url?: string | null }> }): string | null {
  const link = page.properties?.["Enlace directo"] ?? page.properties?.Link;
  if (!link || link.type !== "url") return null;
  const u = link.url?.trim();
  return u || null;
}

/** Lista todas las páginas de una base y devuelve un mapa URL → page_id. */
async function listPageIdsByUrl(databaseId: string): Promise<Map<string, string>> {
  if (!notion) return new Map();
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100
    });
    for (const page of response.results) {
      if (page.object !== "page") continue;
      const url = getUrlFromPage(page as { properties?: Record<string, { type?: string; url?: string | null }> });
      if (url) map.set(url, page.id);
    }
    cursor = response.next_cursor ?? undefined;
  } while (cursor);
  return map;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDateInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return date.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}

/**
 * Sincroniza la base de Supabase con Notion: una tabla por día (first_seen_at).
 * Crea o reutiliza una base "Ofertas de Trabajo - YYYY-MM-DD" por cada día y actualiza/crea páginas.
 */
export async function syncNotionFromDb(options: { sinceDays?: number } = {}): Promise<void> {
  if (!notionEnabled || !notion || !parentPageId) return;
  const sinceDays = options.sinceDays ?? 1;
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < sinceDays; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(formatDateInTimezone(d, notionTimezone));
  }

  for (const date of dates) {
    const jobs = await getJobsByFirstSeenDate(date);
    // Evita crear bases vacías cuando no hay ofertas para ese día.
    if (jobs.length === 0) continue;
    const dbId = await getOrCreateDatabaseForDate(date);
    await sleep(RATE_LIMIT_MS);

    const urlToPageId = await listPageIdsByUrl(dbId);
    await sleep(RATE_LIMIT_MS);

    for (const job of jobs) {
      const props = buildNotionProperties(job);
      const existingId = urlToPageId.get(job.url);
      if (existingId) {
        await notion.pages.update({ page_id: existingId, properties: props });
      } else {
        const created = await notion.pages.create({
          parent: { database_id: dbId },
          properties: props
        });
        urlToPageId.set(job.url, created.id);
      }
      await sleep(RATE_LIMIT_MS);
    }
  }
}
