import { seedHomeConfig } from "./backend/src/lib/seedHome.js";
import { logger } from "./backend/src/lib/logger.js";

async function run() {
  logger.info("Manually triggering Home Config Seed...");
  await seedHomeConfig();
  logger.info("Seed complete.");
  process.exit(0);
}

run();
