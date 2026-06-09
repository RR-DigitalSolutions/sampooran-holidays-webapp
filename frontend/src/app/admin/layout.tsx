import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Sampooran Holidays",
  description: "CSM Main Admin Dashboard",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Client-side authentication logic is handled inside components or higher level layout.
  // For now, we will wrap the admin interface with the Sidebar.
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
