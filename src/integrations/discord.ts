const DISCORD_MAX_CONTENT_LENGTH = 2000;

function getDiscordWebhookUrl(): string {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    throw new Error("Missing DISCORD_WEBHOOK_URL environment variable.");
  }
  return webhook;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendDiscordMessage(
  content: string,
  options: { maxAttempts?: number } = {}
): Promise<void> {
  const webhookUrl = getDiscordWebhookUrl();
  const normalized = content.trim();
  if (!normalized) {
    throw new Error("Discord message content cannot be empty.");
  }

  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const payload = {
    content: normalized.slice(0, DISCORD_MAX_CONTENT_LENGTH)
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Discord webhook responded ${response.status}: ${responseText.slice(0, 400)}`);
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError ?? new Error("Unknown Discord notification error.");
}
