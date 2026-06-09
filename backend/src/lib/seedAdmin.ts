import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_NAME  = process.env.ADMIN_NAME || "admin";
const ADMIN_PASS  = process.env.ADMIN_PASS;

export async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    logger.warn("⚠️ ADMIN_EMAIL and ADMIN_PASS environment variables are not set. Skipping admin seed.");
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
      // Generate a unique referral code for admin
      const referralCode = "ADMIN" + Math.random().toString(36).substring(2, 7).toUpperCase();

      await db.insert(usersTable).values({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: "SUPERADMIN",
        referralCode,
        adminPermissions: JSON.stringify(["ALL"]),
        isFirstLogin: false,
      });

      logger.info(`✅ Default SUPERADMIN seeded: ${ADMIN_EMAIL}`);
    } else {
      // Ensure existing admin has SUPERADMIN role
      if (existing.role !== "SUPERADMIN" && existing.role !== "ADMIN") {
        await db.update(usersTable)
          .set({ role: "SUPERADMIN", adminPermissions: JSON.stringify(["ALL"]) })
          .where(eq(usersTable.email, ADMIN_EMAIL));
        logger.info("✅ Upgraded existing admin to SUPERADMIN");
      }

      // Sync password ONLY if forced via environment variable
      if (process.env.FORCE_SEED_ADMIN === "true") {
        const isMatch = await bcrypt.compare(ADMIN_PASS, existing.passwordHash);
        if (!isMatch) {
          const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
          await db.update(usersTable)
            .set({ passwordHash })
            .where(eq(usersTable.email, ADMIN_EMAIL));
          logger.info("✅ Admin password synced/updated in database to match current environment configuration");
        }
      } else {
        logger.info("ℹ️ Admin user already exists. Skipping credentials sync to prevent overwriting active passwords. Use FORCE_SEED_ADMIN=true to force reset.");
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "❌ seedAdmin failed — admin may not be seeded");
  }
}
