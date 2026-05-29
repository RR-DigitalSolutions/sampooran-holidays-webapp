import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import {
  LayoutDashboard, Package, MapPin, MessageSquare, Users, FileText,
  Settings, LogOut, Menu, X, Plane, ChevronRight, Bell, Search,
  Globe, TrendingUp, Truck, Headset, Wallet, Shield, UserCog, Layers, Building2, Compass, BellRing, Camera, Utensils, Zap
} from "lucide-react";

const ALL_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", permission: null },
  { label: "Home & Themes", icon: Layers, href: "/home-manager", permission: "SETTINGS" },
  { label: "Packages", icon: Package, href: "/packages", permission: "PACKAGES" },
  { label: "Destinations", icon: MapPin, href: "/destinations", permission: "DESTINATIONS" },
  { label: "Travel Guides", icon: Compass, href: "/travel-guides", permission: "DESTINATIONS" },
  { label: "Attractions", icon: Camera, href: "/attractions", permission: "DESTINATIONS" },
  { label: "Activities", icon: Zap, href: "/activities", permission: "DESTINATIONS" },
  { label: "Dining Points", icon: Utensils, href: "/dining", permission: "DESTINATIONS" },
  { label: "Inquiries", icon: MessageSquare, href: "/inquiries", permission: "INQUIRIES", badge: "live" },
  { label: "Live Support", icon: Headset, href: "/support", permission: "SUPPORT" },
  { label: "Travelers", icon: Users, href: "/users", permission: "USERS" },
  { label: "B2B Agents", icon: TrendingUp, href: "/agents", permission: "USERS" },
  { label: "Financial Ledger", icon: Wallet, href: "/finance", permission: "FINANCE" },
  { label: "Blog Posts", icon: FileText, href: "/blogs", permission: "BLOGS" },
  { label: "Transport", icon: Truck, href: "/transport", permission: "TRANSPORT" },
  { label: "OTA Approvals", icon: Shield, href: "/approvals", permission: "PACKAGES", badge: "live" },
  { label: "Hotel Management", icon: Building2, href: "/hotels-manager", permission: "PACKAGES" },
  { label: "Staff & Access", icon: UserCog, href: "/staff", permission: "__SUPERADMIN__" },
  { label: "Settings", icon: Settings, href: "/settings", permission: "SETTINGS" },
];

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: LayoutProps) {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth();
  const { totalUnread, latestToast } = useChatContext();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter nav based on the logged-in user's permissions
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.permission) return true; // Dashboard — always visible
    if (item.permission === "__SUPERADMIN__") return isSuperAdmin;
    return hasPermission(item.permission as any);
  });

  const roleLabel = user?.role === "SUPERADMIN" ? "Super Admin" : "Staff";
  const roleBadgeColor = isSuperAdmin ? "#F5A623" : "#60a5fa";

  return (
    <div className="min-h-screen flex bg-gray-50 font-poppins">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B]`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-2 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center shadow">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block font-poppins">SAMPOORAN HOLIDAYS</span>
            <span className="text-[#F5A623] text-[10px] font-bold tracking-widest">WELCOME TO CMS BY RRDS</span>
          </div>
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-2 mx-auto bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-xl flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-[#F5A623] to-[#1B3A6B]">
              {isSuperAdmin ? <Shield className="w-4 h-4" /> : (user?.username?.[0]?.toUpperCase() || "A")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-xs truncate">{user?.username}</p>
              <p className={`text-[10px] font-bold tracking-wider ${isSuperAdmin ? 'text-[#F5A623]' : 'text-blue-400'}`}>{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase px-3 py-2">Main Menu</p>
          {navItems.map(({ label, icon: Icon, href, badge }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            const isSupportItem = href === "/support";
            return (
              <Link 
                key={href} 
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${isActive ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
              >
                  <Icon className={`shrink-0 transition-colors w-[18px] h-[18px] ${isActive ? "text-[#F5A623]" : "group-hover:text-[#F5A623]"}`} />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  {/* Live badge or unread count for support */}
                  {isSupportItem && totalUnread > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  ) : badge === "live" ? (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
                  ) : null}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-poppins">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-52">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Quick search..." className="bg-transparent text-sm focus:outline-none text-gray-600 w-full" />
            </div>
            <Link 
              href="/support"
              className="relative p-2 rounded-xl hover:bg-gray-100 block" 
              aria-label="Live chat notifications"
            >
                {totalUnread > 0
                  ? <BellRing className="w-5 h-5 text-primary animate-[wiggle_0.5s_ease-in-out_infinite]" />
                  : <Bell className="w-5 h-5 text-gray-600" />
                }
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
            </Link>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-[#1B3A6B]/15 text-[#1B3A6B] bg-[#F0F5FF]">
              <Globe className="w-3.5 h-3.5" /> View Site
            </a>
          </div>
        </header>

        {/* Global toast notification for new chat messages */}
        {latestToast && (
          <div className="fixed top-4 right-4 z-[999] flex items-center gap-3 bg-[#1B3A6B] text-white pl-4 pr-5 py-3 rounded-2xl shadow-2xl shadow-primary/30 border border-white/10 max-w-sm">
            <BellRing className="w-4 h-4 text-yellow-300 shrink-0 animate-bounce" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight line-clamp-2">{latestToast}</p>
            </div>
            <Link 
              href="/support"
              className="shrink-0 text-[10px] font-black bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"
            >
                Reply
            </Link>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
