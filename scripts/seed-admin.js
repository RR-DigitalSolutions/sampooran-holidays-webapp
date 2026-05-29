import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon('postgresql://neondb_owner:npg_n1xbisRJ5zqX@ep-proud-grass-a1nmqtqr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function seed() {
  console.log("Seeding superadmin...");
  try {
    const hash = await bcrypt.hash("admin@sampooran", 10);
    
    // Check if user exists
    const users = await sql`SELECT id FROM users WHERE email = 'admin@sampooran.com' OR name = 'admin' LIMIT 1`;
    
    if (users.length > 0) {
      await sql`UPDATE users SET password_hash = ${hash}, role = 'SUPERADMIN', name = 'admin' WHERE id = ${users[0].id}`;
      console.log("Updated existing user to SUPERADMIN.");
    } else {
      await sql`INSERT INTO users (name, email, password_hash, role, vendor_verified, referral_code, created_at, updated_at) 
                VALUES ('admin', 'admin@sampooran.com', ${hash}, 'SUPERADMIN', true, 'ADMIN123', NOW(), NOW())`;
      console.log("Created new SUPERADMIN user.");
    }
  } catch (err) {
    console.error(err);
  }
}

seed();
