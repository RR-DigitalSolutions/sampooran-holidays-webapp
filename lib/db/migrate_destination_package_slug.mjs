import pg from "pg";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query(`
    ALTER TABLE destinations
    ADD COLUMN IF NOT EXISTS package_page_slug TEXT UNIQUE
  `);
  console.log("Destination package slug migration completed.");
} finally {
  await client.end();
}