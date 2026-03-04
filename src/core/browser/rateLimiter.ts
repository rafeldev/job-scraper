const lastRequestByDomain = new Map<string, number>();

export async function throttleDomain(domain: string, minIntervalMs = 1000): Promise<void> {
  const now = Date.now();
  const lastRequest = lastRequestByDomain.get(domain) ?? 0;
  const elapsed = now - lastRequest;
  if (elapsed < minIntervalMs) {
    await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
  }
  lastRequestByDomain.set(domain, Date.now());
}
