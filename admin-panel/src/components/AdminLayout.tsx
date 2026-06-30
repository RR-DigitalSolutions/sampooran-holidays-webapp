import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import {
  LayoutDashboard, Package, MapPin, MessageSquare, Users, FileText,
  Settings, LogOut, Menu, X, Plane, ChevronRight, ChevronDown, ChevronLeft, Bell, Search,
  Globe, TrendingUp, Truck, Headset, Wallet, Shield, UserCog, Layers, Building2, Compass, BellRing, Camera, Utensils, Zap, UserCheck
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  permission: string | null;
  badge?: "live";
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "website",
    label: "Website & Content",
    items: [
      { label: "Home & Themes", icon: Layers, href: "/home-manager", permission: "SETTINGS" },
      { label: "Blog Posts", icon: FileText, href: "/blogs", permission: "BLOGS" },
    ]
  },
  {
    id: "packages",
    label: "Travel Packages",
    items: [
      { label: "Packages", icon: Package, href: "/packages", permission: "PACKAGES" },
      { label: "OTA Approvals", icon: Shield, href: "/approvals", permission: "PACKAGES", badge: "live" },
    ]
  },
  {
    id: "destinations",
    label: "Destinations & Guides",
    items: [
      { label: "Destinations", icon: MapPin, href: "/destinations", permission: "DESTINATIONS" },
      { label: "Travel Guides", icon: Compass, href: "/travel-guides", permission: "DESTINATIONS" },
      { label: "Attractions", icon: Camera, href: "/attractions", permission: "DESTINATIONS" },
      { label: "Activities", icon: Zap, href: "/activities", permission: "DESTINATIONS" },
      { label: "Dining Points", icon: Utensils, href: "/dining", permission: "DESTINATIONS" },
    ]
  },
  {
    id: "hotels",
    label: "Hotel Department",
    items: [
      { label: "Hotel Management", icon: Building2, href: "/hotels-manager", permission: "PACKAGES" },
      { label: "Hotel Vendors", icon: UserCheck, href: "/hotel-vendors", permission: "PACKAGES" },
    ]
  },
  {
    id: "transport",
    label: "Transport Department",
    items: [
      { label: "Transport", icon: Truck, href: "/transport", permission: "TRANSPORT" },
      { label: "Transport Vendors", icon: UserCheck, href: "/transport-vendors", permission: "TRANSPORT" },
    ]
  },
  {
    id: "b2c",
    label: "B2C Department",
    items: [
      { label: "Travelers", icon: Users, href: "/users", permission: "USERS" },
      { label: "Inquiries", icon: MessageSquare, href: "/inquiries", permission: "INQUIRIES", badge: "live" },
    ]
  },
  {
    id: "b2b",
    label: "B2B Department",
    items: [
      { label: "B2B Agents", icon: TrendingUp, href: "/agents", permission: "USERS" },
    ]
  },
  {
    id: "support",
    label: "Live Chat & Support",
    items: [
      { label: "Live Support", icon: Headset, href: "/support", permission: "SUPPORT" },
    ]
  },
  {
    id: "finance",
    label: "Accounts & Finance",
    items: [
      { label: "Financial Ledger", icon: Wallet, href: "/finance", permission: "FINANCE" },
    ]
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { label: "Staff & Access", icon: UserCog, href: "/staff", permission: "__SUPERADMIN__" },
      { label: "Settings", icon: Settings, href: "/settings", permission: "SETTINGS" },
    ]
  }
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
  const [pendingCityCount, setPendingCityCount] = useState(0);

  // Desktop sidebar collapse mode
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sh_sidebar_collapsed") === "true";
  });

  // Collapsible group open states
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      const active = g.items.some(item => 
        location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))
      );
      initial[g.id] = active;
    });
    return initial;
  });

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sh_sidebar_collapsed", String(next));
  };

  useEffect(() => {
    if (!user) return;
    const fetchPendingCitiesCount = async () => {
      if (document.hidden) return; // Scale optimization: Skip fetch if tab is hidden
      try {
        const res = await fetch(`${API_BASE}/api/admin/pending-cities?status=PENDING`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCityCount(data.pendingCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch pending cities count in sidebar", err);
      }
    };
    
    fetchPendingCitiesCount();

    const handleVisibility = () => {
      if (!document.hidden) fetchPendingCitiesCount();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    // Poll every 120 seconds (optimized from 60 to protect database at scale)
    const interval = setInterval(fetchPendingCitiesCount, 120000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  // Auto-expand group if its child page is active
  useEffect(() => {
    NAV_GROUPS.forEach(g => {
      const active = g.items.some(item => 
        location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))
      );
      if (active) {
        setOpenGroups(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [location]);

  // Filter groups and items based on permissions
  const filteredGroups = NAV_GROUPS.map(group => {
    const items = group.items.filter(item => {
      if (!item.permission) return true;
      if (item.permission === "__SUPERADMIN__") return isSuperAdmin;
      return hasPermission(item.permission as any);
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  const roleLabel = user?.role === "SUPERADMIN" ? "Super Admin" : "Staff";

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 font-poppins">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-20" : "w-66"} bg-gradient-to-b from-[#0D1B3E] to-[#16274E] border-r border-white/5`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2 p-3.5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center shadow shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 transition-opacity duration-300">
              <span className="font-bold text-white text-sm block tracking-wide truncate">SAMPOORAN HOLIDAYS</span>
              <span className="text-[#F5A623] text-[9px] font-bold tracking-widest block truncate">WELCOME TO CMS</span>
            </div>
          )}
          
          {/* Desktop sidebar toggle button */}
          <button 
            className="hidden lg:flex ml-auto w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer border border-white/10"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
          
          {/* Mobile close button */}
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile card */}
        <div className={`px-3 py-2 border-b border-white/10 shrink-0 ${isCollapsed ? "mx-auto" : "mx-2 bg-white/5 border border-white/10 rounded-xl my-2.5"}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br from-[#F5A623] to-[#1E3E7A] shrink-0 shadow-inner">
              {isSuperAdmin ? <Shield className="w-4 h-4" /> : (user?.username?.[0]?.toUpperCase() || "A")}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs truncate">{user?.username}</p>
                <p className="text-[9px] font-bold tracking-wider text-blue-400 uppercase">{roleLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {/* Standalone Dashboard element at the top */}
          <div className="px-1.5">
            <Link 
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${
                location === "/dashboard" 
                  ? "bg-white/15 text-white shadow-sm font-semibold border-l-2 border-[#F5A623]" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <LayoutDashboard className={`shrink-0 transition-colors w-[18px] h-[18px] ${
                location === "/dashboard" ? "text-[#F5A623]" : "group-hover:text-[#F5A623]"
              }`} />
              {!isCollapsed && <span className="text-xs font-medium flex-1">Dashboard</span>}
              {!isCollapsed && location === "/dashboard" && <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
            </Link>
          </div>

          {/* Labeled collapsible groups */}
          <div className="space-y-3 mt-4">
            {filteredGroups.map((group) => {
              const isOpen = !!openGroups[group.id];
              const isGroupActive = group.items.some(item => 
                location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))
              );

              if (isCollapsed) {
                // Collapsed sidebar view - just icons with group lines
                return (
                  <div key={group.id} className="border-t border-white/10 pt-2 mt-2 px-1.5 space-y-1.5">
                    {group.items.map(({ label, icon: Icon, href, badge }) => {
                      const itemActive = location === href || (href !== "/dashboard" && location.startsWith(href));
                      const isSupportItem = href === "/support";
                      return (
                        <Link 
                          key={href} 
                          href={href}
                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all group cursor-pointer relative mx-auto ${
                            itemActive ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                          title={label}
                        >
                          <Icon className={`shrink-0 transition-colors w-[18px] h-[18px] ${itemActive ? "text-[#F5A623]" : "group-hover:text-[#F5A623]"}`} />
                          
                          {/* Badges in collapsed view */}
                          {isSupportItem && totalUnread > 0 ? (
                            <span className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shadow-md animate-pulse">
                              {totalUnread > 9 ? "9+" : totalUnread}
                            </span>
                          ) : href === "/hotels-manager" && pendingCityCount > 0 ? (
                            <span className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center shadow-md">
                              {pendingCityCount}
                            </span>
                          ) : badge === "live" ? (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 animate-pulse border border-[#0D1B3E]" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              // Normal expanded view
              return (
                <div key={group.id} className="px-1.5 space-y-1">
                  {/* Collapsible Section Header */}
                  <button
                    onClick={() => setOpenGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-[10.5px] font-bold tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors group/header cursor-pointer mb-0.5`}
                  >
                    <span className={isGroupActive ? "text-[#F5A623]/80" : ""}>{group.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? "" : "-rotate-90 text-white/30"}`} />
                  </button>

                  {/* Section navigation links with CSS transition */}
                  <div className={`transition-all duration-300 overflow-hidden space-y-0.5 ${isOpen ? "max-h-[350px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"}`}>
                    {group.items.map(({ label, icon: Icon, href, badge }) => {
                      const itemActive = location === href || (href !== "/dashboard" && location.startsWith(href));
                      const isSupportItem = href === "/support";
                      return (
                        <Link 
                          key={href} 
                          href={href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group cursor-pointer ${
                            itemActive 
                              ? "bg-white/10 text-white shadow-sm font-semibold border-l-2 border-[#F5A623]" 
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className={`shrink-0 transition-colors w-[18px] h-[18px] ${itemActive ? "text-[#F5A623]" : "group-hover:text-[#F5A623]"}`} />
                          <span className="text-[11.5px] flex-1 truncate">{label}</span>

                          {/* Badge notifications */}
                          {isSupportItem && totalUnread > 0 ? (
                            <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shadow">
                              {totalUnread > 9 ? "9+" : totalUnread}
                            </span>
                          ) : href === "/hotels-manager" && pendingCityCount > 0 ? (
                            <span className="min-w-[16px] h-4 px-1.5 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center shadow">
                              {pendingCityCount}
                            </span>
                          ) : badge === "live" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Live" />
                          ) : null}

                          {itemActive && <ChevronRight className="w-3 h-3 text-white/40 shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer/Logout button */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button 
            onClick={logout} 
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 font-poppins">{title}</h1>
            {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-52">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="Quick search..." className="bg-transparent text-xs focus:outline-none text-gray-600 w-full" />
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
