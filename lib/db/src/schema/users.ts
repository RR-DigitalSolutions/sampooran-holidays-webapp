import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"), // 'USER', 'AGENT', 'ADMIN', 'SUPERADMIN', 'HOTEL_OWNER', 'TRANSPORTER'
  
  // Vendors & Multi-tenancy
  vendorVerified: boolean("vendor_verified").default(false),
  vendorBusinessName: text("vendor_business_name"),
  vendorBusinessAddress: text("vendor_business_address"),

  // Rewards & Referrals
  pointsBalance: real("points_balance").default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredById: integer("referred_by_id"),
  isFirstLogin: boolean("is_first_login").default(true),
  
  // B2B Specifics
  badge: text("badge").default("BRONZE"), // 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'
  lifetimeSalesCount: integer("lifetime_sales_count").default(0),
  companyName: text("company_name"),
  gstNumber: text("gst_number"),
  
  // Admin sub-permissions (JSON array: ["BLOGS","INQUIRIES","FINANCE","TRANSPORT","PACKAGES","DESTINATIONS","SUPPORT","BOOKINGS","SETTINGS","ALL"])
  adminPermissions: text("admin_permissions"),
  
  profilePicUrl: text("profile_pic_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
