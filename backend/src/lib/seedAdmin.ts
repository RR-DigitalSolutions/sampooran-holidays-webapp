import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN_EMAIL = "admin@sampooran.com";
const ADMIN_NAME  = "admin";
const ADMIN_PASS  = "admin@sampooran";

export async function seedAdmin() {
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

      logger.info("✅ Default SUPERADMIN seeded: admin@sampooran.com / admin@sampooran");
    } else {
      // Ensure existing admin has SUPERADMIN role
      if (existing.role !== "SUPERADMIN" && existing.role !== "ADMIN") {
        await db.update(usersTable)
          .set({ role: "SUPERADMIN", adminPermissions: JSON.stringify(["ALL"]) })
          .where(eq(usersTable.email, ADMIN_EMAIL));
        logger.info("✅ Upgraded existing admin to SUPERADMIN");
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "❌ seedAdmin failed — admin may not be seeded");
  }
}
