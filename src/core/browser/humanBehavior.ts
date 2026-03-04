import type { Page } from "playwright";
import { randomDelay, randomInt } from "../utils/random.js";

export async function simulateHumanBehavior(page: Page, minDelayMs: number, maxDelayMs: number): Promise<void> {
  await randomDelay(minDelayMs, maxDelayMs);
  await page.mouse.move(randomInt(40, 300), randomInt(40, 200), { steps: randomInt(5, 20) });
  await page.mouse.wheel(0, randomInt(150, 500));
  await randomDelay(300, 1000);
}
