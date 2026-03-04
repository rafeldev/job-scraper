import { describe, expect, it } from "vitest";
import { buildVersionFingerprint, isLikelyDuplicate } from "./dedupe.js";
import { normalizeJob } from "./normalizer.js";

describe("dedupe parser", () => {
  it("detecta descripciones similares como duplicadas", () => {
    const a = "Buscamos frontend react con 3 años de experiencia en TypeScript.";
    const b = "Buscamos frontend React con tres años de experiencia en TypeScript";
    expect(isLikelyDuplicate(a, b, 0.7)).toBe(true);
  });

  it("genera fingerprint estable por versión", () => {
    const job = normalizeJob(
      {
        title: "Frontend Dev",
        company: "Acme",
        location: "Medellín",
        description: "React role",
        url: "https://example.com/1"
      },
      "ElEmpleo"
    );
    const fp = buildVersionFingerprint(job);
    expect(fp.includes("frontend dev")).toBe(true);
    expect(fp.includes("acme")).toBe(true);
  });
});
