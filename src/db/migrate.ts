import fs from "node:fs";
import path from "node:path";
import { db } from "./client.js";

async function migrate(): Promise<void> {
  const migrationsDir = path.resolve("src/db/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const fileName of files) {
    const alreadyApplied = await db.query("SELECT 1 FROM schema_migrations WHERE version = $1", [fileName]);
    if (alreadyApplied.rowCount) continue;

    const filePath = path.join(migrationsDir, fileName);
    const sql = fs.readFileSync(filePath, "utf8");
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations(version) VALUES ($1)", [fileName]);
      await db.query("COMMIT");
      console.log(`Applied migration ${fileName}`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
}

migrate()
  .then(async () => {
    await db.end();
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await db.end();
    process.exit(1);
  });
