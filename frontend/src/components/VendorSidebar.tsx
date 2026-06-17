"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, BookOpen, Wallet, BarChart3, User, LogOut, Plane, ChevronRight
} from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { cn } from "@/lib/utils";

export default function VendorSidebar() {
  const { vendor, logout } = useVendorAuth();
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: BarChart3, href: "/partner/dashboard" },
    { label: "My Properties", icon: Building2, href: "/partner/properties" },
    { label: "Bookings", icon: BookOpen, href: "/partner/bookings" },
    { label: "Revenue", icon: Wallet, href: "/partner/revenue" },
    { label: "Profile", icon: User, href: "/partner/profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B] shrink-0 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center">
          <Plane className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-xs leading-tight">SAMPOORAN</p>
          <p className="text-[#F5A623] text-[9px] font-bold tracking-widest">PARTNER PORTAL</p>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#F5A623] to-amber-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
            {vendor?.name?.[0]?.toUpperCase() || "V"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">{vendor?.name || "Vendor"}</p>
            <p className={`text-[10px] font-bold ${vendor?.vendorVerified ? "text-emerald-400" : "text-amber-400"}`}>
              {vendor?.vendorVerified ? "✓ Verified Partner" : "⏳ Pending Approval"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          // Match EXACT path or parent path (e.g. /partner/properties/new matches /partner/properties)
          const isActive = pathname === item.href || (item.href !== "/partner/dashboard" && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-semibold",
                isActive 
                  ? "bg-white/15 text-white" 
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-[#F5A623]" : "text-white/60")} />
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/40 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-white/10">
        <button 
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
