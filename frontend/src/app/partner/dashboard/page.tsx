"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, BookOpen, Wallet, TrendingUp, Plus, ArrowRight,
  CheckCircle, Clock, AlertTriangle, Star, MapPin, Bed, LogOut,
  Settings, User, Plane, Bell, ChevronRight, BarChart3
} from "lucide-react";
import { useVendorAuth, vendorAuthHeader } from "@/context/VendorAuthContext";

import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

interface DashboardStats {
  totalBookings: number;
  totalInquiries: number;
  totalRevenue: number;
  totalProperties: number;
  activeProperties: number;
  pendingBookings: number;
}

interface Hotel {
  id: number;
  name: string;
  slug: string;
  type: string;
  starRating: number;
  status: string;
  city?: string;
  images?: string[];
  minPrice: number;
  totalRooms: number;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function VendorDashboardPage() {
  const { vendor, token, isLoading, logout } = useVendorAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.replace("/partner/login");
    }
  }, [vendor, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    try {
      const [statsRes, hotelsRes] = await Promise.all([
        fetch(`${API_BASE}/vendor/dashboard`, { headers: vendorAuthHeader(token) }),
        fetch(`${API_BASE}/vendor/hotels`, { headers: vendorAuthHeader(token) }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (hotelsRes.ok) setHotels(await hotelsRes.json());
    } catch {}
    finally { setFetching(false); }
  }, [token]);

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    APPROVED: { label: "Live", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
    PENDING: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
    REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", icon: AlertTriangle },
    DRAFT: { label: "Draft", color: "text-gray-500", bg: "bg-gray-100", icon: Settings },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0B1F4E] to-[#1B3A6B] shrink-0">
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

        {/* Vendor info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F5A623] to-amber-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
              {vendor.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{vendor.name}</p>
              <p className={`text-[10px] font-bold ${vendor.vendorVerified ? "text-emerald-400" : "text-amber-400"}`}>
                {vendor.vendorVerified ? "✓ Verified Partner" : "⏳ Pending Approval"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {[
            { label: "Dashboard", icon: BarChart3, href: "/partner/dashboard", active: true },
            { label: "My Properties", icon: Building2, href: "/partner/properties" },
            { label: "Bookings", icon: BookOpen, href: "/partner/bookings" },
            { label: "Revenue", icon: Wallet, href: "/partner/revenue" },
            { label: "Profile", icon: User, href: "/partner/profile" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${item.active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <item.icon className={`w-4 h-4 ${item.active ? "text-[#F5A623]" : "group-hover:text-[#F5A623]"}`} />
              {item.label}
              {item.active && <ChevronRight className="w-3.5 h-3.5 text-white/40 ml-auto" />}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-black text-gray-900 text-lg">Dashboard</h1>
            <p className="text-xs text-gray-400">Welcome back, {vendor.name?.split(" ")[0]}</p>
          </div>
          <div className="flex items-center gap-3">
            {!vendor.vendorVerified && (
              <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5" /> Awaiting admin approval
              </div>
            )}
            <Link href="/partner/properties/new"
              className="flex items-center gap-1.5 bg-[#1B3A6B] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0f2548] transition-colors">
              <Plus className="w-4 h-4" /> Add Property
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Verification Notice */}
          {!vendor.vendorVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">Account Under Review</p>
                <p className="text-amber-700 text-xs mt-0.5">Your vendor account is being reviewed by our team. You can list properties now — they will go live once your account and each property are approved. This usually takes 24 hours.</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {fetching ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="w-11 h-11 bg-gray-100 rounded-xl mb-4" />
                  <div className="h-7 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-50 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={Building2} label="Total Properties" value={stats?.totalProperties || 0} color="bg-[#1B3A6B]" />
              <StatCard icon={CheckCircle} label="Live Properties" value={stats?.activeProperties || 0} sub="Currently accepting bookings" color="bg-emerald-500" />
              <StatCard icon={BookOpen} label="Total Bookings" value={stats?.totalBookings || 0} color="bg-violet-500" />
              <StatCard icon={Clock} label="Pending Bookings" value={stats?.pendingBookings || 0} sub="Awaiting your confirmation" color="bg-amber-500" />
              <StatCard icon={AlertTriangle} label="Inquiries" value={stats?.totalInquiries || 0} color="bg-blue-500" />
              <StatCard icon={Wallet} label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} sub="From confirmed bookings" color="bg-rose-500" />
            </div>
          )}

          {/* Properties */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">My Properties</h2>
              <Link href="/partner/properties" className="text-sm text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {fetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                    <div className="h-32 bg-gray-100 rounded-xl mb-4" />
                    <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-50 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                <Building2 className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                <h3 className="font-bold text-gray-700 mb-2">No properties listed yet</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">List your first property and start receiving bookings from travellers across India.</p>
                <Link href="/partner/properties/new"
                  className="inline-flex items-center gap-2 bg-[#1B3A6B] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0f2548] transition-colors">
                  <Plus className="w-4 h-4" /> List Your First Property
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotels.slice(0, 6).map(hotel => {
                  const cfg = STATUS_CONFIG[hotel.status] || STATUS_CONFIG.DRAFT;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={hotel.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group block">
                      <Link href={`/partner/properties/${hotel.id}`} className="block">
                        <div className="h-36 bg-gray-100 relative overflow-hidden">
                          {hotel.images?.[0] ? (
                            <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-10 h-10 text-gray-200" />
                            </div>
                          )}
                          <div className={`absolute top-3 left-3 flex items-center gap-1 ${cfg.bg} ${cfg.color} px-2.5 py-1 rounded-full text-[10px] font-bold`}>
                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/partner/properties/${hotel.id}`} className="block">
                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#1B3A6B] transition-colors leading-tight mb-1">{hotel.name}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">{hotel.type}</span>
                          </div>
                          {hotel.city && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                              <MapPin className="w-3 h-3" /> {hotel.city}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
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
                        </Link>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                          <Link href={`/partner/properties/${hotel.id}?tab=rooms`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Rooms Category</Link>
                          <Link href={`/partner/properties/${hotel.id}?tab=inventory`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Room Inventory</Link>
                          <Link href={`/partner/properties/${hotel.id}?tab=overview`} className="text-[10px] font-bold text-[#1B3A6B] hover:underline">Facilities</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/partner/properties/new"
              className="bg-gradient-to-br from-[#1B3A6B] to-[#0f2548] text-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl hover:shadow-blue-900/20 transition-all group">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Add New Property</p>
                <p className="text-xs text-white/60">List a hotel, resort, cottage & more</p>
              </div>
            </Link>
            <Link href="/partner/bookings"
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl hover:shadow-emerald-500/20 transition-all group">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Manage Bookings</p>
                <p className="text-xs text-white/60">Confirm, reject & manage reservations</p>
              </div>
            </Link>
            <Link href="/partner/revenue"
              className="bg-gradient-to-br from-violet-500 to-violet-700 text-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl hover:shadow-violet-500/20 transition-all group">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Revenue & Payouts</p>
                <p className="text-xs text-white/60">Track earnings & settlement history</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
