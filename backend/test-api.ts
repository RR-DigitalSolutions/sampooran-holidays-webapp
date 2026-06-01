import "dotenv/config";
import jwt from "jsonwebtoken";

async function test() {
  try {
    const token = jwt.sign({ userId: 1, role: "SUPER_ADMIN", permissions: ["DESTINATIONS"] }, process.env.JWT_SECRET || "supersecret");
    
    const res = await fetch("http://localhost:8080/api/admin/countries", {
      headers: {
        "Cookie": `token=${token}`
      }
    });
    
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch(e: any) {
    console.error("Fetch Error:", e);
  }
  process.exit(0);
}
test();
