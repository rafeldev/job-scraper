import { pickRandom } from "../utils/random.js";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:141.0) Gecko/20100101 Firefox/141.0"
];

export function getRandomUserAgent(): string {
  return pickRandom(USER_AGENTS);
}
