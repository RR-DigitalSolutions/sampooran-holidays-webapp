import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  
  console.log("Adding columns to countries...");
  try {
    await client.query(`ALTER TABLE "countries" ADD COLUMN "show_in_menu" boolean DEFAULT false NOT NULL;`);
    await client.query(`ALTER TABLE "countries" ADD COLUMN "nav_menu_order" integer DEFAULT 0 NOT NULL;`);
    console.log("Success for countries");
  } catch (e) {
    console.log("Error countries:", e.message);
  }

  console.log("Adding columns to states...");
  try {
    await client.query(`ALTER TABLE "states" ADD COLUMN "show_in_menu" boolean DEFAULT false NOT NULL;`);
    await client.query(`ALTER TABLE "states" ADD COLUMN "nav_menu_order" integer DEFAULT 0 NOT NULL;`);
    console.log("Success for states");
  } catch (e) {
    console.log("Error states:", e.message);
  }

  await client.end();
}

main().catch(console.error);
