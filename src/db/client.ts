import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});
