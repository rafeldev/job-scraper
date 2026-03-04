/**
 * Sincroniza la base de Supabase con Notion: una tabla por día (first_seen_at).
 * Uso: npm run sync:notion
 * Requiere: DATABASE_URL, NOTION_API_KEY, NOTION_PARENT_PAGE_ID, NOTION_SYNC_ENABLED=true
 */
import dotenv from "dotenv";
import { syncNotionFromDb } from "../integrations/notion.js";

dotenv.config();

const sinceDays = parseInt(process.env.NOTION_SYNC_SINCE_DAYS ?? "7", 10) || 7;

async function main() {
  await syncNotionFromDb({ sinceDays });
}

main().catch((err) => {
  console.error("Error en sync Notion:", err);
  process.exit(1);
});
