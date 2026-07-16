import pg from "pg";
import dotenv from "dotenv";
import path from "path";

const { Client } = pg;

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  
  console.log("Connecting to database to add column show_on_frontend...");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("ALTER TABLE hotels ADD COLUMN IF NOT EXISTS show_on_frontend BOOLEAN DEFAULT true;");
    console.log("Successfully added column show_on_frontend to hotels table!");
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to run query:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
