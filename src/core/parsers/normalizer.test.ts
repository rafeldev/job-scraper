import { describe, expect, it } from "vitest";
import { normalizeJob, parsePostedDate, passesFilters } from "./normalizer.js";

describe("normalizeJob", () => {
  it("normaliza campos principales y detecta tecnologías", () => {
    const normalized = normalizeJob(
      {
        title: "Frontend React Developer",
        company: "Acme",
        location: "Bogotá",
        salary: "$8.000.000 COP",
        description: "Buscamos React + TypeScript para remoto",
        url: "https://co.indeed.com/viewjob?jk=123",
        postedAt: new Date().toISOString()
      },
      "Indeed Colombia"
    );

    expect(normalized.canonicalId).toHaveLength(32);
    expect(normalized.modality).toBe("remote");
    expect(normalized.technologies).toEqual(expect.arrayContaining(["react", "typescript"]));
  });

  it("aplica filtros por keywords y empresas excluidas", () => {
    const job = normalizeJob(
      {
        title: "Frontend React Developer",
        company: "BairesDev",
        location: "Bogotá",
        description: "React + TypeScript",
        url: "https://example.com/job/1",
        postedAt: new Date().toISOString()
      },
      "Computrabajo"
    );

    const allowed = passesFilters(job, {
      keywords: ["react"],
      locations: ["bogotá"],
      modalities: ["remote"],
      maxAgeHours: 48,
      excludeCompanies: ["bairesdev"]
    });

    expect(allowed).toBe(false);
  });
});

describe("parsePostedDate", () => {
  it("convierte 'Hace 3 horas' a ISO y no devuelve string crudo", () => {
    const result = parsePostedDate("Hace 3 horas");
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result).not.toBe("Hace 3 horas");
  });

  it("convierte 'Hace 4 días' (con espacios y sufijo) a ISO", () => {
    const result = parsePostedDate("Hace  4  días (actualizada)");
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("devuelve undefined para texto no parseable", () => {
    expect(parsePostedDate("Urge contratar")).toBeUndefined();
    expect(parsePostedDate("")).toBeUndefined();
    expect(parsePostedDate(undefined)).toBeUndefined();
  });

  it("deja ISO existente como está", () => {
    const iso = "2026-02-16T12:00:00.000Z";
    expect(parsePostedDate(iso)).toBe(iso);
  });
});
