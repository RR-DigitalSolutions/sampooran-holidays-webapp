"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle, LayoutDashboard, Settings, Users, Package, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Approvals", href: "/admin/approvals", icon: CheckCircle },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Destinations", href: "/admin/destinations", icon: Map },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 p-4 border-r border-slate-800">
      <div className="mb-8 px-4">
        <h2 className="text-xl font-bold text-white font-serif">CSM Admin</h2>
        <p className="text-xs text-slate-500 mt-1">Management Portal</p>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
