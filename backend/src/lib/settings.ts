import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    return row ? row.value : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

export async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
  const val = await getSetting(key, defaultValue.toString());
  return Number(val);
}
