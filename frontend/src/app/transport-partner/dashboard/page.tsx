"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Calendar, Wallet, Plus, Eye, CheckCircle2, AlertTriangle,
  XCircle, UserCheck, ShieldAlert, LogOut, LayoutDashboard, TrendingUp,
  MapPin, Star, Settings, Bell, RefreshCw, Car, Users, FileText,
  ChevronRight, ArrowUpRight, Clock, Activity, Zap, Shield, Fuel,
  Navigation, Phone, Mail, Edit3, Save, X, ChevronDown, BarChart3,
  Package, Award, Route, Loader2, CheckCircle, Info, AlertCircle
} from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { API_BASE } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vehicle {
  id: number;
  name: string;
  type: string;
  subType?: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  seatingCapacity: number;
  luggageCapacity?: number;
  isAC?: boolean;
  minPrice?: number;
  basePricePerKm?: number;
  basePricePerDay?: number;
  registrationNumber?: string;
  status: string;
  features?: string[];
  images?: string[];
  description?: string;
  destinationSlug?: string;
  customCity?: string;
  isFeatured?: boolean;
}

interface Booking {
  id: number;
  bookingRef: string;
  vehicle_name: string;
  customer_name: string;
  customer_phone?: string;
  pickup_date: string;
  pickup_time: string;
  pickup_address: string;
  drop_address: string;
  totalAmount: number;
  status: string;
  totalKm?: number;
  vehicle_type?: string;
}

interface Stats {
  totalVehicles: number;
  approvedVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  monthRevenue: number;
  recentBookings: Booking[];
}

interface VendorProfile {
  id?: number;
  businessName?: string;
  businessType?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  operatingSince?: number;
  operatingCities?: string[];
  vehicleTypes?: string[];
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  logoUrl?: string;
  description?: string;
  status?: string;
  commissionPct?: number;
  adminNote?: string;
}

const VEHICLE_TYPES = ["CAB", "TEMPO_TRAVELLER", "BUS", "LUXURY", "SELF_DRIVE"];
const VEHICLE_TYPE_ICONS: Record<string, string> = {
  CAB: "🚕", TEMPO_TRAVELLER: "🚐", BUS: "🚌", LUXURY: "🏎️", SELF_DRIVE: "🚗"
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  APPROVED: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  PENDING:  { label: "Under Review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  DRAFT:    { label: "Draft", color: "text-slate-400", bg: "bg-slate-800/60 border-slate-700", dot: "bg-slate-400" },
  SUSPENDED:{ label: "Suspended", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: any; label: string; value: string | number; sub?: string; trend?: number; color: string;
}) {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 overflow-hidden group hover:border-slate-700 transition-all">
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 ${color}`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center mb-4`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
        {(sub || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
                {Math.abs(trend)}%
              </span>
            )}
            {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: (v: Vehicle) => void }) {
  const cfg = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.PENDING;
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
      {/* Image / placeholder */}
      <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {vehicle.images && vehicle.images.length > 0 ? (
          <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {VEHICLE_TYPE_ICONS[vehicle.type] || "🚗"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${vehicle.status === "APPROVED" ? "animate-pulse" : ""}`} />
            {cfg.label}
          </span>
        </div>
        {vehicle.isFeatured && (
          <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> FEATURED
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-white text-sm leading-tight">{vehicle.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md shrink-0 ml-2">{vehicle.type}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-xs font-bold text-white">{vehicle.seatingCapacity}</p>
            <p className="text-[9px] text-slate-500">Seats</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-xs font-bold text-white">{vehicle.isAC ? "AC" : "Non-AC"}</p>
            <p className="text-[9px] text-slate-500">Climate</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-xs font-bold text-amber-400">₹{vehicle.minPrice || vehicle.basePricePerDay || 0}</p>
            <p className="text-[9px] text-slate-500">/day</p>
          </div>
        </div>

        {vehicle.features && vehicle.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vehicle.features.slice(0, 3).map(f => (
              <span key={f} className="text-[9px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md">{f.replace(/_/g, " ")}</span>
            ))}
            {vehicle.features.length > 3 && <span className="text-[9px] text-slate-500">+{vehicle.features.length - 3}</span>}
          </div>
        )}

        {vehicle.registrationNumber && (
          <p className="font-mono text-[10px] text-slate-500 bg-slate-800/40 px-2 py-1 rounded-lg mb-3">
            RC: {vehicle.registrationNumber}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            {vehicle.basePricePerKm && (
              <span className="text-[10px] text-slate-400">₹{vehicle.basePricePerKm}/km</span>
            )}
          </div>
          <button onClick={() => onEdit(vehicle)}
            className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function TransporterDashboard() {
  const router = useRouter();
  const { vendor, token, logout, isLoading } = useVendorAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "fleet" | "bookings" | "profile" | "earnings">("overview");
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0, approvedVehicles: 0, totalBookings: 0,
    pendingBookings: 0, confirmedBookings: 0, totalRevenue: 0,
    monthRevenue: 0, recentBookings: []
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [vehicleForm, setVehicleForm] = useState({
    name: "", type: "CAB", subType: "", make: "", model: "",
    year: new Date().getFullYear(), color: "", registrationNumber: "",
    seatingCapacity: 4, luggageCapacity: 2, isAC: true,
    minPrice: 0, basePricePerKm: 0, basePricePerDay: 0,
    features: "", images: "", description: "", customCity: "",
  });

  const authH = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const notify = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auth guard
  useEffect(() => {
    if (!isLoading && !vendor) router.push("/transport-partner");
  }, [vendor, isLoading, router]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/dashboard`, { headers: authH });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [token]);

  const fetchVehicles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/vehicles`, { headers: authH });
      if (res.ok) setVehicles(await res.json());
    } catch {} finally { setLoading(false); }
  }, [token]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/bookings`, { headers: authH });
      if (res.ok) setBookings(await res.json());
    } catch {}
  }, [token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/profile`, { headers: authH });
      if (res.ok) setProfile(await res.json());
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchStats();
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "fleet") fetchVehicles();
    if (activeTab === "bookings") fetchBookings();
  }, [activeTab, token]);

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVehicle(true);
    try {
      const payload = {
        ...vehicleForm,
        features: vehicleForm.features ? vehicleForm.features.split(",").map(s => s.trim()).filter(Boolean) : [],
        images: vehicleForm.images ? vehicleForm.images.split("\n").map(s => s.trim()).filter(Boolean) : [],
        name: vehicleForm.name || `${vehicleForm.make} ${vehicleForm.model}`,
      };

      let res;
      if (editingVehicle) {
        res = await fetch(`${API_BASE}/vendor/transport/vehicles/${editingVehicle.id}`, {
          method: "PATCH", headers: authH, body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/vendor/transport/vehicles`, {
          method: "POST", headers: authH, body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save vehicle");
      }

      notify("success", editingVehicle ? "Vehicle updated successfully!" : "Vehicle registered! Awaiting admin approval.");
      setShowAddVehicle(false);
      setEditingVehicle(null);
      resetVehicleForm();
      fetchVehicles();
      fetchStats();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setSavingVehicle(false);
    }
  };

  const resetVehicleForm = () => setVehicleForm({
    name: "", type: "CAB", subType: "", make: "", model: "",
    year: new Date().getFullYear(), color: "", registrationNumber: "",
    seatingCapacity: 4, luggageCapacity: 2, isAC: true,
    minPrice: 0, basePricePerKm: 0, basePricePerDay: 0,
    features: "", images: "", description: "", customCity: "",
  });

  const openEdit = (v: Vehicle) => {
    setVehicleForm({
      name: v.name || "", type: v.type, subType: v.subType || "", make: v.make, model: v.model,
      year: v.year || new Date().getFullYear(), color: v.color || "", registrationNumber: v.registrationNumber || "",
      seatingCapacity: v.seatingCapacity, luggageCapacity: v.luggageCapacity || 2,
      isAC: v.isAC !== false, minPrice: v.minPrice || 0,
      basePricePerKm: v.basePricePerKm || 0, basePricePerDay: v.basePricePerDay || 0,
      features: Array.isArray(v.features) ? v.features.join(", ") : "",
      images: Array.isArray(v.images) ? v.images.join("\n") : "",
      description: v.description || "", customCity: v.customCity || "",
    });
    setEditingVehicle(v);
    setShowAddVehicle(true);
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/bookings/${id}`, {
        method: "PATCH", headers: authH, body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchBookings();
        fetchStats();
        notify("success", `Booking ${status.toLowerCase()}`);
      }
    } catch {}
  };

  const saveProfile = async (data: VendorProfile) => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/profile`, {
        method: "POST", headers: authH, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setProfile(await res.json());
      notify("success", "Business profile saved!");
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your console...</p>
        </div>
      </div>
    );
  }

  const approvedVehicles = vehicles.filter(v => v.status === "APPROVED");
  const pendingVehicles = vehicles.filter(v => v.status === "PENDING");

  const NAV = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "fleet", icon: Truck, label: "Fleet Registry" },
    { id: "bookings", icon: Calendar, label: "Trips & Bookings" },
    { id: "earnings", icon: Wallet, label: "Earnings" },
    { id: "profile", icon: Settings, label: "Business Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex overflow-hidden">

      {/* ── Notification Toast ── */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all border ${
          notification.type === "success"
            ? "bg-emerald-950 border-emerald-700 text-emerald-300"
            : "bg-red-950 border-red-700 text-red-300"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 border-r border-slate-800/70 bg-slate-950 flex flex-col justify-between py-6">
        {/* Brand */}
        <div className="space-y-6 px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-black text-[11px] uppercase tracking-wider text-white">Fleet Console</p>
              <p className="text-[9px] text-amber-400 uppercase font-bold tracking-widest">Partner Portal</p>
            </div>
          </div>

          {/* Vendor Status Badge */}
          <div className={`px-3 py-2.5 rounded-xl border text-xs ${
            profile?.status === "APPROVED"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : profile?.status === "PENDING"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-slate-800/80 border-slate-700 text-slate-400"
          }`}>
            <p className="font-black text-[10px] uppercase mb-0.5">
              {profile?.status === "APPROVED" ? "✅ Verified Partner" : profile?.status === "PENDING" ? "⏳ Under Review" : "⚠️ Setup Incomplete"}
            </p>
            <p className="text-[9px] opacity-80 truncate">{profile?.businessName || vendor?.vendorBusinessName || vendor?.name}</p>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {NAV.map(item => (
              <button key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}>
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
                {item.id === "bookings" && stats.pendingBookings > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {stats.pendingBookings}
                  </span>
                )}
                {item.id === "fleet" && pendingVehicles.length > 0 && (
                  <span className="ml-auto bg-amber-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingVehicles.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-5 space-y-2">
          <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-[9px] text-slate-500 font-bold uppercase">Commission Rate</p>
            <p className="text-sm font-black text-amber-400">{profile?.commissionPct ?? 15}%</p>
          </div>
          <button onClick={() => { logout(); router.push("/transport-partner"); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold rounded-xl transition-all">
            <LogOut className="w-3.5 h-3.5" /> Exit Console
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top Bar */}
        <header className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
          <div>
            <h1 className="text-base font-black text-white">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "fleet" && "Fleet Registry"}
              {activeTab === "bookings" && "Trips & Bookings"}
              {activeTab === "earnings" && "Earnings & Settlements"}
              {activeTab === "profile" && "Business Profile"}
            </h1>
            <p className="text-xs text-slate-400">
              {vendor.name} · {profile?.city || "—"} · {profile?.state || "India"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchStats(); fetchVehicles(); fetchBookings(); }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            {activeTab === "fleet" && (
              <button onClick={() => { resetVehicleForm(); setEditingVehicle(null); setShowAddVehicle(true); }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                <Plus className="w-3.5 h-3.5" /> Register Vehicle
              </button>
            )}
          </div>
        </header>

        {/* ─── Pending Admin Note Banner ─── */}
        {profile?.adminNote && (
          <div className="mx-8 mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Admin Note: </span>{profile.adminNote}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* ════════════════ OVERVIEW TAB ════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Truck} label="Registered Vehicles" value={stats.totalVehicles}
                  sub={`${stats.approvedVehicles} live`} color="bg-blue-500" />
                <StatCard icon={Calendar} label="Total Trips" value={stats.totalBookings}
                  sub={`${stats.pendingBookings} pending`} color="bg-violet-500" />
                <StatCard icon={Wallet} label="Lifetime Earnings" value={`₹${stats.totalRevenue.toLocaleString()}`}
                  color="bg-emerald-500" />
                <StatCard icon={TrendingUp} label="This Month" value={`₹${stats.monthRevenue.toLocaleString()}`}
                  color="bg-amber-500" />
              </div>

              {/* Fleet Health + Recent Trips */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fleet Health */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" /> Fleet Health
                  </h3>
                  {vehicles.length === 0 ? (
                    <div className="text-center py-6">
                      <Truck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No vehicles yet</p>
                      <button onClick={() => { setActiveTab("fleet"); }}
                        className="mt-2 text-xs text-amber-400 hover:underline">Register your first vehicle →</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[
                        { label: "Live / Approved", count: approvedVehicles.length, color: "text-emerald-400", dot: "bg-emerald-400" },
                        { label: "Pending Review", count: pendingVehicles.length, color: "text-amber-400", dot: "bg-amber-400" },
                        { label: "Rejected / Suspended", count: vehicles.filter(v => ["REJECTED","SUSPENDED"].includes(v.status)).length, color: "text-red-400", dot: "bg-red-400" },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                            <span className="text-xs text-slate-300">{row.label}</span>
                          </div>
                          <span className={`text-sm font-black ${row.color}`}>{row.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveTab("fleet")}
                    className="w-full text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 pt-1">
                    Manage Fleet <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Recent Trips */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                    <Route className="w-4 h-4 text-amber-400" /> Recent Trips
                  </h3>
                  {stats.recentBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-xs text-slate-500">No bookings yet. Your trip log will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentBookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center gap-4 p-3 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl transition-all">
                          <div className={`w-2 h-8 rounded-full shrink-0 ${
                            b.status === "CONFIRMED" ? "bg-emerald-500" :
                            b.status === "PENDING" ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{b.vehicle_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{b.pickup_address} → {b.drop_address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-amber-400">₹{b.totalAmount.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500">{b.pickup_date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveTab("bookings")}
                    className="w-full text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 pt-3">
                    View All Trips <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Quick Tips */}
              {profile?.status !== "APPROVED" && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-amber-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Complete Your Profile to Go Live
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: "Business Profile", done: !!profile?.businessName, icon: FileText },
                      { label: "Register Vehicle", done: vehicles.length > 0, icon: Truck },
                      { label: "Bank Details", done: !!profile?.bankAccountNumber, icon: Wallet },
                      { label: "Admin Approval", done: profile?.status === "APPROVED", icon: Shield },
                    ].map(step => (
                      <div key={step.label} className={`p-3 rounded-xl border flex items-center gap-2 ${step.done ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-900 border-slate-800"}`}>
                        <step.icon className={`w-4 h-4 shrink-0 ${step.done ? "text-emerald-400" : "text-slate-500"}`} />
                        <div>
                          <p className={`font-bold ${step.done ? "text-emerald-400" : "text-slate-400"}`}>{step.label}</p>
                          <p className={`text-[9px] ${step.done ? "text-emerald-500" : "text-slate-500"}`}>{step.done ? "Done ✓" : "Incomplete"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ FLEET TAB ════════════════ */}
          {activeTab === "fleet" && (
            <div className="space-y-4">
              {/* Summary Strip */}
              <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(
                  vehicles.reduce((acc, v) => {
                    acc[v.status] = (acc[v.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status];
                  return cfg ? (
                    <span key={status} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-bold ${cfg.bg} ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {count} {cfg.label}
                    </span>
                  ) : null;
                })}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse" />)}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <Truck className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No vehicles registered yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Start by registering your first vehicle. Admin will review and approve it.</p>
                  <button onClick={() => { resetVehicleForm(); setEditingVehicle(null); setShowAddVehicle(true); }}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl">
                    <Plus className="w-4 h-4" /> Register First Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} onEdit={openEdit} />)}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ BOOKINGS TAB ════════════════ */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {["All", "PENDING", "CONFIRMED", "CANCELLED"].map(s => (
                  <button key={s} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    {s === "All" ? "All Trips" : s.charAt(0) + s.slice(1).toLowerCase()}
                    {s === "PENDING" && stats.pendingBookings > 0 && (
                      <span className="ml-1.5 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">{stats.pendingBookings}</span>
                    )}
                  </button>
                ))}
              </div>

              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <Calendar className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No bookings yet</p>
                  <p className="text-xs text-slate-500 mt-1">Your trip bookings will appear here once received.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => {
                    const cfg = STATUS_CONFIG[b.status];
                    return (
                      <div key={b.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-1.5 self-stretch rounded-full ${cfg?.dot || "bg-slate-600"}`} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-black text-white text-sm">{b.bookingRef}</span>
                                {cfg && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-300">{b.vehicle_name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                <Navigation className="w-3 h-3" />
                                <span>{b.pickup_address}</span>
                                <span>→</span>
                                <span>{b.drop_address}</span>
                              </div>
                              <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.customer_name}</span>
                                {b.customer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.customer_phone}</span>}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.pickup_date} {b.pickup_time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 lg:flex-col lg:items-end shrink-0">
                            <p className="text-lg font-black text-amber-400">₹{b.totalAmount.toLocaleString()}</p>
                            {b.status === "PENDING" && (
                              <div className="flex gap-2">
                                <button onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                                </button>
                                <button onClick={() => updateBookingStatus(b.id, "CANCELLED")}
                                  className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border border-red-500/30">
                                  <XCircle className="w-3.5 h-3.5" /> Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ EARNINGS TAB ════════════════ */}
          {activeTab === "earnings" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Wallet} label="Lifetime Earnings" value={`₹${stats.totalRevenue.toLocaleString()}`} color="bg-emerald-500" />
                <StatCard icon={TrendingUp} label="This Month" value={`₹${stats.monthRevenue.toLocaleString()}`} color="bg-amber-500" />
                <StatCard icon={Calendar} label="Total Trips" value={stats.totalBookings} sub={`${stats.confirmedBookings || 0} confirmed`} color="bg-violet-500" />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" /> Settlement Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Commission Rate</span>
                      <span className="font-bold text-white">{profile?.commissionPct ?? 15}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Settlement Cycle</span>
                      <span className="font-bold text-white">Weekly</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Account Name</span>
                      <span className="font-bold text-white">{profile?.bankAccountName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Bank</span>
                      <span className="font-bold text-white">{profile?.bankName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">IFSC</span>
                      <span className="font-bold font-mono text-white">{profile?.bankIfscCode || "—"}</span>
                    </div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-xs text-amber-400 font-bold mb-1">Your Net Rate</p>
                    <p className="text-3xl font-black text-white">{100 - (profile?.commissionPct ?? 15)}%</p>
                    <p className="text-xs text-slate-400 mt-1">of every confirmed trip fare is yours</p>
                    <button onClick={() => setActiveTab("profile")}
                      className="mt-4 text-xs text-amber-400 hover:underline text-left">Update bank details →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ PROFILE TAB ════════════════ */}
          {activeTab === "profile" && (
            <ProfileEditor
              profile={profile}
              vendor={vendor}
              onSave={saveProfile}
              saving={savingProfile}
            />
          )}

        </div>
      </main>

      {/* ════════════════ ADD / EDIT VEHICLE MODAL ════════════════ */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingVehicle ? "Edit Vehicle" : "Register New Vehicle"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingVehicle ? "Update vehicle details" : "Submit for admin approval — goes live once approved"}
                </p>
              </div>
              <button onClick={() => { setShowAddVehicle(false); setEditingVehicle(null); }}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Vehicle Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Display Name</label>
                <input value={vehicleForm.name} onChange={e => setVehicleForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="e.g. Toyota Innova Crysta – Manali" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Vehicle Type *</label>
                  <select required value={vehicleForm.type} onChange={e => setVehicleForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_TYPE_ICONS[t]} {t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Sub-Type</label>
                  <input value={vehicleForm.subType} onChange={e => setVehicleForm(f => ({ ...f, subType: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="SUV, Sedan, Volvo..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Make *</label>
                  <input required value={vehicleForm.make} onChange={e => setVehicleForm(f => ({ ...f, make: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Toyota" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Model *</label>
                  <input required value={vehicleForm.model} onChange={e => setVehicleForm(f => ({ ...f, model: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Innova Crysta" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Year</label>
                  <input type="number" value={vehicleForm.year} onChange={e => setVehicleForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Seats *</label>
                  <input type="number" required value={vehicleForm.seatingCapacity} onChange={e => setVehicleForm(f => ({ ...f, seatingCapacity: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Bags</label>
                  <input type="number" value={vehicleForm.luggageCapacity} onChange={e => setVehicleForm(f => ({ ...f, luggageCapacity: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Color</label>
                  <input value={vehicleForm.color} onChange={e => setVehicleForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="White" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Min Price/Day (₹)</label>
                  <input type="number" value={vehicleForm.minPrice || ""} onChange={e => setVehicleForm(f => ({ ...f, minPrice: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="3500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Price/Day (₹)</label>
                  <input type="number" value={vehicleForm.basePricePerDay || ""} onChange={e => setVehicleForm(f => ({ ...f, basePricePerDay: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="4000" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Price/KM (₹)</label>
                  <input type="number" value={vehicleForm.basePricePerKm || ""} onChange={e => setVehicleForm(f => ({ ...f, basePricePerKm: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="14" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Reg. Number</label>
                  <input value={vehicleForm.registrationNumber} onChange={e => setVehicleForm(f => ({ ...f, registrationNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    placeholder="HP-01-A-1234" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Operating City</label>
                  <input value={vehicleForm.customCity} onChange={e => setVehicleForm(f => ({ ...f, customCity: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Manali, Shimla..." />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={vehicleForm.isAC} onChange={e => setVehicleForm(f => ({ ...f, isAC: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-slate-300 font-medium">AC Vehicle</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Features (comma separated)</label>
                <input value={vehicleForm.features} onChange={e => setVehicleForm(f => ({ ...f, features: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  placeholder="WIFI, CHARGING_PORT, GPS, MUSIC, RECLINER, BLANKET" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Description</label>
                <textarea value={vehicleForm.description} onChange={e => setVehicleForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Describe your vehicle..." />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Image URLs (one per line)</label>
                <textarea value={vehicleForm.images} onChange={e => setVehicleForm(f => ({ ...f, images: e.target.value }))}
                  rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="https://..." />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddVehicle(false); setEditingVehicle(null); }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={savingVehicle}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm font-black rounded-xl transition-all">
                  {savingVehicle ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" />{editingVehicle ? "Update Vehicle" : "Submit for Approval"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfileEditorProps {
  profile: VendorProfile | null;
  vendor: any;
  onSave: (d: VendorProfile) => void;
  saving: boolean;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, vendor, onSave, saving }) => {
  const [form, setForm] = useState<VendorProfile>({
    businessName: "", businessType: "PROPRIETORSHIP", phone: "", alternatePhone: "",
    email: "", website: "", address: "", city: "", state: "", pincode: "",
    gstNumber: "", panNumber: "", operatingSince: undefined,
    operatingCities: [], vehicleTypes: [],
    bankAccountName: "", bankAccountNumber: "", bankIfscCode: "", bankName: "",
    logoUrl: "", description: "",
    ...profile
  });

  const up = (k: keyof VendorProfile, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (profile) setForm(prev => ({ ...prev, ...profile }));
  }, [profile]);

  const sections = [
    {
      title: "Business Identity", icon: FileText,
      fields: [
        { label: "Business Name *", key: "businessName", placeholder: "e.g. Himalayan Fleet Services" },
        { label: "Business Type", key: "businessType", type: "select", options: ["PROPRIETORSHIP","PARTNERSHIP","PRIVATE_LTD","LLP","INDIVIDUAL"] },
        { label: "Operating Since (Year)", key: "operatingSince", type: "number", placeholder: "2015" },
        { label: "Description", key: "description", type: "textarea", placeholder: "About your fleet business..." },
      ]
    },
    {
      title: "Contact Details", icon: Phone,
      fields: [
        { label: "Primary Phone *", key: "phone", placeholder: "+91 9876543210" },
        { label: "Alternate Phone", key: "alternatePhone", placeholder: "+91 9876543211" },
        { label: "Business Email", key: "email", placeholder: "business@example.com" },
        { label: "Website", key: "website", placeholder: "https://yourfleet.com" },
      ]
    },
    {
      title: "Registered Address", icon: MapPin,
      fields: [
        { label: "Address *", key: "address", placeholder: "Street / Colony / Building", cols: 2 },
        { label: "City *", key: "city", placeholder: "Manali" },
        { label: "State *", key: "state", placeholder: "Himachal Pradesh" },
        { label: "Pincode", key: "pincode", placeholder: "175131" },
      ]
    },
    {
      title: "Legal & GST", icon: Shield,
      fields: [
        { label: "GST Number", key: "gstNumber", placeholder: "22AAAAA0000A1Z5", mono: true },
        { label: "PAN Number", key: "panNumber", placeholder: "AAAAA0000A", mono: true },
      ]
    },
    {
      title: "Bank Details (for settlements)", icon: Wallet,
      fields: [
        { label: "Account Holder Name", key: "bankAccountName", placeholder: "Full legal name" },
        { label: "Account Number", key: "bankAccountNumber", placeholder: "••••••••••", mono: true },
        { label: "IFSC Code", key: "bankIfscCode", placeholder: "SBIN0001234", mono: true },
        { label: "Bank Name", key: "bankName", placeholder: "State Bank of India" },
      ]
    },
  ];

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-5">
      {sections.map(section => (
        <div key={section.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <section.icon className="w-4 h-4 text-amber-400" /> {section.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((f: any) => (
              <div key={f.key} className={f.cols === 2 ? "md:col-span-2" : ""}>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">{f.label}</label>
                {f.type === "select" ? (
                  <select value={(form as any)[f.key] || ""} onChange={e => up(f.key as any, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors">
                    {f.options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={(form as any)[f.key] || ""} onChange={e => up(f.key as any, e.target.value)}
                    rows={3} placeholder={f.placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none" />
                ) : (
                  <input type={f.type || "text"} value={(form as any)[f.key] || ""} onChange={e => up(f.key as any, e.target.value)}
                    placeholder={f.placeholder}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors ${f.mono ? "font-mono" : ""}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black rounded-xl transition-all text-sm shadow-lg shadow-amber-500/20">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Business Profile</>}
        </button>
      </div>
    </form>
  );
};
