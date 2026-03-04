import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext } from "playwright";
import { getRandomUserAgent } from "./userAgents.js";

chromium.use(stealthPlugin());

export async function createBrowser(): Promise<Browser> {
  try {
    return chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-dev-shm-usage"
      ]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Executable doesn't exist")) {
      throw new Error(
        "No se encontro el navegador de Playwright. Ejecuta: `npm run playwright:install` y luego intenta de nuevo."
      );
    }
    throw error;
  }
}

export async function createContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: getRandomUserAgent(),
    locale: "es-CO",
    timezoneId: "America/Bogota",
    viewport: { width: 1366, height: 768 }
  });
}
