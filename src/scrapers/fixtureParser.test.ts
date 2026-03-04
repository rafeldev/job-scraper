import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseJobsFromHtmlFixture } from "./fixtureParser.js";
import { loadConfig } from "../core/config.js";

describe("fixture parser", () => {
  it("parsea tarjetas de empleo desde HTML de fixture", () => {
    const config = loadConfig();
    const indeed = config.sites.find((s) => s.name === "Indeed Colombia");
    if (!indeed) throw new Error("Indeed config missing");
    const html = fs.readFileSync(path.resolve("src/scrapers/fixtures/indeed-listing.html"), "utf8");
    const jobs = parseJobsFromHtmlFixture(html, indeed);
    expect(jobs.length).toBe(2);
    expect(jobs[0].title.toLowerCase()).toContain("react");
    expect(jobs[0].url).toContain("indeed");
  });
});
