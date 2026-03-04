import { JSDOM } from "jsdom";
import type { RawJob } from "../types/job.js";
import type { SiteConfig } from "../core/interfaces.js";

export function parseJobsFromHtmlFixture(html: string, siteConfig: SiteConfig): RawJob[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const cards = queryAllFirst(document, siteConfig.selectors.card);
  const jobs: RawJob[] = [];

  for (const card of cards) {
    const title = textFromSelectors(card, siteConfig.selectors.title);
    const link = attrFromSelectors(card, siteConfig.selectors.link, "href");
    if (!title || !link) continue;
    jobs.push({
      title,
      url: link,
      company: textFromSelectors(card, siteConfig.selectors.company),
      location: textFromSelectors(card, siteConfig.selectors.location),
      salary: textFromSelectors(card, siteConfig.selectors.salary),
      postedAt: textFromSelectors(card, siteConfig.selectors.date),
      description: textFromSelectors(card, siteConfig.selectors.description ?? [])
    });
  }
  return jobs;
}

function queryAllFirst(root: Document | Element, selectors: string[]): Element[] {
  for (const selector of selectors) {
    const nodes = Array.from(root.querySelectorAll(selector));
    if (nodes.length > 0) return nodes;
  }
  return [];
}

function textFromSelectors(root: Element, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const text = node?.textContent?.trim();
    if (text) return text;
  }
  return undefined;
}

function attrFromSelectors(root: Element, selectors: string[], attr: string): string | undefined {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const value = node?.getAttribute(attr)?.trim();
    if (value) return value;
  }
  return undefined;
}
