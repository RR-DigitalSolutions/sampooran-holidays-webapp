"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Building2, MapPin, Star, Bed, Edit2, Eye, Trash2,
  CheckCircle, Clock, AlertTriangle, Settings, Search, Filter,
  BarChart3, BookOpen, Wallet, LogOut, User, ChevronRight, Plane, Grid3X3, LayoutList
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  APPROVED: { label: "Live", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  PENDING_APPROVAL: { label: "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  PENDING: { label: "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  DRAFT: { label: "Draft", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: Settings },
};

function VendorSidebar({ active }: { active: string }) {
  const { vendor, logout } = useVendorAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B] shrink-0 min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center">
          <Plane className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-xs leading-tight">SAMPOORAN</p>
          <p className="text-[#F5A623] text-[9px] font-bold tracking-widest">PARTNER PORTAL</p>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#F5A623] to-amber-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
            {vendor?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">{vendor?.name}</p>
            <p className={`text-[10px] font-bold ${vendor?.vendorVerified ? "text-emerald-400" : "text-amber-400"}`}>
              {vendor?.vendorVerified ? "✓ Verified Partner" : "⏳ Pending Approval"}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {[
          { label: "Dashboard", icon: BarChart3, href: "/partner/dashboard" },
          { label: "My Properties", icon: Building2, href: "/partner/properties" },
          { label: "Bookings", icon: BookOpen, href: "/partner/bookings" },
          { label: "Revenue", icon: Wallet, href: "/partner/revenue" },
          { label: "Profile", icon: User, href: "/partner/profile" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
              active === item.href ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
            <item.icon className={cn("w-4 h-4", active === item.href && "text-[#F5A623]")} />
            {item.label}
            {active === item.href && <ChevronRight className="w-3.5 h-3.5 text-white/40 ml-auto" />}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all text-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function VendorPropertiesPage() {
  const { vendor, token, isLoading, logout } = useVendorAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !vendor) router.replace("/partner/login");
  }, [vendor, isLoading, router]);

  const fetchHotels = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/hotels`, { headers: vendorAuthHeader(token) });
      if (res.ok) setHotels(await res.json());
    } catch {}
    finally { setFetching(false); }
  }, [token]);

  useEffect(() => { if (token) fetchHotels(); }, [token, fetchHotels]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this property? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`${API_BASE}/vendor/hotels/${id}`, { method: "DELETE", headers: vendorAuthHeader(token) });
      setHotels(h => h.filter(x => x.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  const filtered = hotels.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || (h.city || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar active="/partner/properties" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-black text-gray-900 text-lg">My Properties</h1>
            <p className="text-xs text-gray-400">{hotels.length} total · {hotels.filter(h => h.status === "APPROVED").length} live</p>
          </div>
          <Link href="/partner/properties/new"
            className="flex items-center gap-1.5 bg-[#1B3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0f2548] transition-colors">
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        </header>

        <main className="flex-1 p-6">
          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
                placeholder="Search properties..." />
            </div>
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B3A6B] text-gray-600">
                <option value="all">All Statuses</option>
                <option value="APPROVED">Live</option>
                <option value="PENDING_APPROVAL">Under Review</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <div className="flex bg-gray-100 p-0.5 rounded-xl">
                <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-all", viewMode === "grid" ? "bg-white shadow text-[#1B3A6B]" : "text-gray-400")}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-white shadow text-[#1B3A6B]" : "text-gray-400")}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
                  <div className="h-40 bg-gray-100 rounded-t-2xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-50 rounded w-1/2" />
                    <div className="h-8 bg-gray-50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 text-center">
              <Building2 className="w-14 h-14 mx-auto mb-4 text-gray-200" />
              <h3 className="font-bold text-gray-700 mb-2">
                {search || statusFilter !== "all" ? "No matching properties" : "No properties listed yet"}
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                {search || statusFilter !== "all" ? "Try different filters." : "List your first property and start receiving bookings."}
              </p>
              {!search && statusFilter === "all" && (
                <Link href="/partner/properties/new"
                  className="inline-flex items-center gap-2 bg-[#1B3A6B] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0f2548] transition-colors">
                  <Plus className="w-4 h-4" /> List Your First Property
                </Link>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(hotel => {
                const cfg = STATUS_CONFIG[hotel.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = cfg.icon;
                return (
                  <div key={hotel.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      {hotel.images?.[0] ? (
                        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 flex items-center gap-1 ${cfg.bg} ${cfg.color} border px-2.5 py-1 rounded-full text-[10px] font-bold`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight line-clamp-1">{hotel.name}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                        <span className="text-[10px] text-gray-400 ml-1">{hotel.type}</span>
                      </div>
                      {hotel.city && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                          <MapPin className="w-3 h-3" /> {hotel.city}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mb-3">
                        <div>
                          <span className="text-sm font-black text-[#1B3A6B]">
                            {hotel.minPrice ? `₹${hotel.minPrice.toLocaleString()}` : "—"}
                          </span>
                          <span className="text-xs text-gray-400">/night</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Bed className="w-3.5 h-3.5" /> {hotel.totalRooms || 0} rooms
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-50">
                        <Link href={`/partner/properties/${hotel.id}?tab=rooms`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Rooms Category</Link>
                        <Link href={`/partner/properties/${hotel.id}?tab=inventory`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Room Inventory</Link>
                        <Link href={`/partner/properties/${hotel.id}?tab=overview`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Facilities</Link>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/partner/properties/${hotel.id}`}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl bg-[#1B3A6B]/5 text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white transition-all">
                          <Edit2 className="w-3.5 h-3.5" /> Manage
                        </Link>
                        <Link href={`/hotels/${hotel.slug}`} target="_blank"
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-[#1B3A6B] text-gray-400 hover:text-[#1B3A6B] transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(hotel.id)} disabled={deleting === hotel.id}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(hotel => {
                const cfg = STATUS_CONFIG[hotel.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = cfg.icon;
                return (
                  <div key={hotel.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all flex group">
                    <div className="w-32 h-24 bg-gray-100 relative overflow-hidden shrink-0">
                      {hotel.images?.[0] ? (
                        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{hotel.name}</h3>
                          <span className={`flex items-center gap-1 ${cfg.bg} ${cfg.color} border px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0`}>
                            <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{hotel.type}</span>
                          {hotel.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {hotel.city}</span>}
                          <span className="flex items-center gap-0.5"><Bed className="w-2.5 h-2.5" /> {hotel.totalRooms || 0} rooms</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right mr-2">
                          <p className="text-sm font-black text-[#1B3A6B]">{hotel.minPrice ? `₹${hotel.minPrice.toLocaleString()}` : "—"}</p>
                          <p className="text-[10px] text-gray-400">/night</p>
                        </div>
                        <Link href={`/partner/properties/${hotel.id}`}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-[#1B3A6B] text-white hover:bg-[#0f2548] transition-colors">
                          <Edit2 className="w-3 h-3" /> Manage
                        </Link>
                        <Link href={`/hotels/${hotel.slug}`} target="_blank"
                          className="p-2 rounded-xl border border-gray-200 hover:border-[#1B3A6B] text-gray-400 hover:text-[#1B3A6B] transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(hotel.id)} disabled={deleting === hotel.id}
                          className="p-2 rounded-xl border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
