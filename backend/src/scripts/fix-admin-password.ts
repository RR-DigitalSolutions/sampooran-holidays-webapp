// No dotenv needed — use dotenv-cli to load env vars before running this script
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@sampooran.com";
const ADMIN_NAME  = "admin";
const ADMIN_PASS  = "admin@sampooran";

async function main() {
  console.log("Checking admin user in database...");
  console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
  
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    console.log("Admin user found:", existing.email, "role:", existing.role);
    console.log("Re-hashing password with bcryptjs...");
    const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
    
    await db.update(usersTable)
      .set({ 
        passwordHash,
        role: "SUPERADMIN",
        adminPermissions: JSON.stringify(["ALL"]),
      })
      .where(eq(usersTable.email, ADMIN_EMAIL));
    
    console.log("✅ Admin password reset successfully!");
    
    // Verify the password works
    const verify = await bcrypt.compare(ADMIN_PASS, passwordHash);
    console.log("Password verification:", verify ? "✅ PASS" : "❌ FAIL");
  } else {
    console.log("Admin user NOT found. Creating...");
    const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);
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
    
    console.log("✅ Admin user created successfully!");
  }
  
  // List all users
  const admins = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role, name: usersTable.name }).from(usersTable);
  console.log("\nAll users in database:");
  admins.forEach(u => console.log(`  - ${u.email} (${u.role}) name=${u.name}`));

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
