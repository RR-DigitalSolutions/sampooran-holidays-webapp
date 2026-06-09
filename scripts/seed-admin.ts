import { db, usersTable } from "./lib/db/src/index.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  console.log("🌱 Verifying Admin User...");
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASS = process.env.ADMIN_PASS;
    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      console.error("❌ ADMIN_EMAIL and ADMIN_PASS environment variables must be set!");
      process.exit(1);
    }
    try {
      const passwordHash = await bcrypt.hash(ADMIN_PASS, 10);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);

    if (existing) {
      await db.update(usersTable).set({
        passwordHash,
        name: "admin",
        role: "SUPERADMIN",
      }).where(eq(usersTable.id, existing.id));
      console.log("✅ Admin user updated");
    } else {
      await db.insert(usersTable).values({
        name: "admin",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "SUPERADMIN",
        referralCode: "SUPERADMIN_1",
        vendorVerified: true,
      });
      console.log("✅ Admin user created");
    }
    process.exit(0);
  } catch (e) {
    console.error("❌ Failed to seed admin:", e);
    process.exit(1);
  }
}
seedAdmin();
