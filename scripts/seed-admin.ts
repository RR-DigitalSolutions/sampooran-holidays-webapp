import { db, usersTable } from "./lib/db/src/index.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  console.log("🌱 Verifying Admin User...");
  try {
    const passwordHash = await bcrypt.hash("admin@sampooran", 10);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@sampooran.com")).limit(1);

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
        email: "admin@sampooran.com",
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
