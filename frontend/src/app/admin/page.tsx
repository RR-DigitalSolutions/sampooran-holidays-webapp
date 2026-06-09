import { redirect } from "next/navigation";

export default function AdminPage() {
  // Redirect to approvals for now until we build a full dashboard
  redirect("/admin/approvals");
}
