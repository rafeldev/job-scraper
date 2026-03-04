export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = randomInt(minMs, maxMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick an item from an empty array.");
  }
  return items[randomInt(0, items.length - 1)];
}
