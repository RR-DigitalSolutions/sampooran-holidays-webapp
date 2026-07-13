import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter, MapPin, CheckCircle, XCircle,
  Truck, LayoutGrid, List, RefreshCw, Eye, Ban,
  Users, Wallet, BookOpen, Shield, ChevronDown, ChevronUp, X,
  Save, Camera, Clock, Phone, Globe, Mail, AlertTriangle, TrendingUp, Info, DollarSign
} from "lucide-react";
import { getApiUrl } from "@/utils/api-url";
import { useAuth } from "../context/AuthContext";

const API_URL = getApiUrl();

interface Vehicle {
  id: number;
  name: string;
  slug: string;
  type: string;
  subType?: string;
  make: string;
  model: string;
  registrationNumber?: string;
  seatingCapacity: number;
  minPrice: number;
  status: string;
  isFeatured: boolean;
  features?: string[];
  images?: string[];
  basePricePerKm?: number;
  basePricePerDay?: number;
  city_name?: string;
  owner_name?: string;
  owner_email?: string;
  vendor_business_name_full?: string;
}

interface Vendor {
  id: number;
  userId: number;
  businessName: string;
  businessType: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
  commissionPct: number;
  adminNote?: string;
  approvedAt?: string;
  createdAt: string;
  ownerName?: string;
  ownerEmail?: string;
}

interface Booking {
  id: number;
  bookingRef: string;
  vehicle_name: string;
  vehicle_type: string;
  customer_name: string;
  pickup_date: string;
  pickup_time: string;
  pickup_address: string;
  drop_address: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
}

interface Route {
  id: number;
  from: string;
  to: string;
  distance: number;
  estimatedTime: string;
  startingPrice: number;
  isPopular: boolean;
}

const VEHICLE_TYPES = ["CAB", "TEMPO_TRAVELLER", "BUS", "LUXURY", "SELF_DRIVE"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED: { label: "Approved/Live", color: "text-emerald-700", bg: "bg-emerald-50" },
  PENDING: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
  DRAFT: { label: "Draft", color: "text-gray-500", bg: "bg-gray-50" },
};

export default function Transport() {
  const { user } = useAuth();

  // ── Always-fresh auth headers using React context token ──────────────────
  const authHeaders = useCallback((): Record<string, string> => ({
    "Authorization": `Bearer ${user?.token || ""}`,
    "Content-Type": "application/json",
  }), [user?.token]);

  const [activeTab, setActiveTab] = useState<"vendors" | "vehicles" | "bookings" | "routes" | "dashboard">("dashboard");
  const [stats, setStats] = useState<any>({
    totalVehicles: 0,
    approvedVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthRevenue: 0,
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Detail & Form Modals
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({
    from: "",
    to: "",
    distance: 0,
    estimatedTime: "",
    startingPrice: 0,
    isPopular: false,
  });

  // Add Vehicle Modal (Admin CRM direct entry)
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [addVehicleSaving, setAddVehicleSaving] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "CAB",
    subType: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    seatingCapacity: 4,
    luggageCapacity: 2,
    isAC: true,
    minPrice: 0,
    basePricePerKm: 0,
    basePricePerDay: 0,
    features: "",
    images: "",
    description: "",
    isFeatured: false,
    // Admin-created vehicles are immediately APPROVED and visible on the site
    status: "APPROVED",
    customCity: "",
  });

  // ── Stats: use admin vehicles + vendors endpoint instead of vendor dashboard ─
  const fetchStats = useCallback(async () => {
    try {
      const [vRes, vendorRes] = await Promise.all([
        fetch(`${API_URL}/admin/transport-vehicles`, { headers: authHeaders() }),
        fetch(`${API_URL}/admin/transport-vendors`,  { headers: authHeaders() }),
      ]);
      const [allVehicles, allVendors] = await Promise.all([
        vRes.ok   ? vRes.json()      : [],
        vendorRes.ok ? vendorRes.json() : [],
      ]);
      setStats({
        totalVehicles:    allVehicles.length || 0,
        approvedVehicles: (allVehicles as any[]).filter((v: any) => v.status === "APPROVED").length,
        totalVendors:     allVendors.length || 0,
        activeVendors:    (allVendors as any[]).filter((v: any) => v.status === "APPROVED").length,
        pendingVehicles:  (allVehicles as any[]).filter((v: any) => v.status === "PENDING").length,
        totalBookings:    0,
        pendingBookings:  0,
        totalRevenue:     0,
        monthRevenue:     0,
      });
    } catch (e) {
      console.error("[Transport] Stats fetch error:", e);
    }
  }, [authHeaders]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      // Use admin endpoint so we get ALL vehicles (not just own vendor's)
      const res = await fetch(`${API_URL}/admin/transport-vehicles`, { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        console.error("[Transport] fetchVehicles error:", err);
      } else {
        setVehicles(await res.json());
      }
    } catch (e) {
      console.error("[Transport] fetchVehicles network error:", e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/transport-vendors`, { headers: authHeaders() });
      if (res.ok) setVendors(await res.json());
    } catch (e) {
      console.error("[Transport] fetchVendors error:", e);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/transport/bookings`, { headers: authHeaders() });
      if (res.ok) setBookings(await res.json());
    } catch (e) {
      console.error("[Transport] fetchBookings error:", e);
    }
  }, [authHeaders]);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transport/routes`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (e) {
      console.error("[Transport] fetchRoutes error:", e);
    }
  }, [authHeaders]);

  // Re-fetch when user token is available (avoids Invalid Token on first load)
  useEffect(() => {
    if (!user?.token) return;
    fetchStats();
    if (activeTab === "vendors")  fetchVendors();
    if (activeTab === "vehicles") fetchVehicles();
    if (activeTab === "bookings") fetchBookings();
    if (activeTab === "routes")   fetchRoutes();
  }, [activeTab, user?.token, fetchStats, fetchVendors, fetchVehicles, fetchBookings, fetchRoutes]);

  const updateVehicleStatus = async (id: number, status: string, isFeatured?: boolean) => {
    try {
      const body: any = { status };
      if (isFeatured !== undefined) body.isFeatured = isFeatured;
      const res = await fetch(`${API_URL}/admin/transport-vehicles/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchVehicles();
        fetchStats();
        setSelectedVehicle(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateVendorStatus = async (id: number, status: string, adminNote?: string) => {
    try {
      const body: any = { status };
      if (adminNote) body.adminNote = adminNote;
      const res = await fetch(`${API_URL}/admin/transport-vendors/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) fetchVendors();
    } catch (e) {
      console.error(e);
    }
  };

  const runHimachalSeed = async () => {
    if (!confirm("Seed 2 demo Himachal transport vendors (Shimla + Manali) with 5 vehicles each? This is safe to run multiple times.")) return;
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/seed-himachal-transport`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setSeedResult(data);
      fetchStats();
    } catch (e: any) {
      setSeedResult({ error: e.message });
    } finally {
      setSeedLoading(false);
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/vendor/transport/bookings/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchBookings();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.name || !newVehicle.make || !newVehicle.model) {
      alert("Name, Make, and Model are required.");
      return;
    }
    setAddVehicleSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/transport-vehicles`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newVehicle),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create vehicle");
      }
      setShowAddVehicle(false);
      setNewVehicle({
        name: "", type: "CAB", subType: "", make: "", model: "",
        year: new Date().getFullYear(), seatingCapacity: 4, luggageCapacity: 2,
        isAC: true, minPrice: 0, basePricePerKm: 0, basePricePerDay: 0,
        features: "", images: "", description: "", isFeatured: false,
        status: "APPROVED", customCity: "",
      });
      fetchVehicles();
      fetchStats();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAddVehicleSaving(false);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/transport/routes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newRoute),
      });
      if (res.ok) {
        fetchRoutes();
        setIsAddingRoute(false);
        setNewRoute({ from: "", to: "", distance: 0, estimatedTime: "", startingPrice: 0, isPopular: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (v.vendor_business_name_full && v.vendor_business_name_full.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType === "ALL" || v.type === filterType;
    const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <AdminLayout title="Transport Fleet Manager" subtitle="Approve vendors, fleets, audit vehicle condition reports & manage routes">
      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-100 mb-6 pb-px overflow-x-auto">
        <button onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "dashboard" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Overview
        </button>
        <button onClick={() => setActiveTab("vendors")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "vendors" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Vendors
        </button>
        <button onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "vehicles" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Vehicles & Fleets
        </button>
        <button onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "bookings" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Bookings
        </button>
        <button onClick={() => setActiveTab("routes")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "routes" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Fixed Routes
        </button>
      </div>

      {/* ── Dashboard Tab ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.totalVehicles}</p>
                <p className="text-xs text-gray-400 font-medium">Total Fleet</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.pendingBookings}</p>
                <p className="text-xs text-gray-400 font-medium">Pending Approvals</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">₹{stats.totalRevenue?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">Lifetime Sales</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">₹{stats.monthRevenue?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">This Month</p>
              </div>
            </div>
          </div>

          {/* Seed Demo Vendors */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Demo Data: Himachal Transport Vendors</h3>
                <p className="text-xs text-gray-400 mt-0.5">Seeds 2 verified transport vendors (Shimla + Manali) with 5 vehicles each and pricing rules. Safe to re-run.</p>
              </div>
              <button
                onClick={runHimachalSeed}
                disabled={seedLoading}
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#16305a] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {seedLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Seeding...</> : <><Plus className="w-3.5 h-3.5" /> Seed Himachal Demo</>}
              </button>
            </div>
            {seedResult && (
              <div className={`mt-3 p-4 rounded-xl text-xs font-mono ${seedResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                {seedResult.error ? `Error: ${seedResult.error}` : (
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-700">✅ {seedResult.message}</p>
                    {seedResult.credentials?.map((c: any, i: number) => (
                      <div key={i} className="bg-white/60 rounded-lg p-3 border border-emerald-200">
                        <p className="font-bold text-gray-800">{c.city} Vendor ({c.vehicleCount} vehicles)</p>
                        <p>📧 Email: <span className="font-bold">{c.email}</span></p>
                        <p>🔑 Password: <span className="font-bold">{c.password}</span></p>
                        <p>🔗 Login: <a href={c.loginUrl} className="underline" target="_blank">{c.loginUrl}</a></p>
                        <p className="mt-1 text-gray-500">Vehicles: {c.vehicles?.join(" • ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveTab("vendors")} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Manage Vendors →</button>
              <button onClick={() => setActiveTab("vehicles")} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Approve Vehicles →</button>
              <button onClick={() => setActiveTab("routes")} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Manage Routes →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vendors Tab ── */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{vendors.length} Transport Vendors</p>
            <button onClick={fetchVendors} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No vendors yet</p>
              <p className="text-xs text-gray-300 mt-1">Use the "Seed Himachal Demo" button on Overview to add demo vendors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map(v => {
                const statusCfg: Record<string, {label:string;color:string;bg:string}> = {
                  APPROVED: {label:"Approved",color:"text-emerald-700",bg:"bg-emerald-50"},
                  PENDING:  {label:"Pending",color:"text-amber-700",bg:"bg-amber-50"},
                  REJECTED: {label:"Rejected",color:"text-red-700",bg:"bg-red-50"},
                  SUSPENDED:{label:"Suspended",color:"text-gray-600",bg:"bg-gray-100"},
                };
                const cfg = statusCfg[v.status] || statusCfg.PENDING;
                return (
                  <div key={v.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 text-sm">{v.businessName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold">{v.businessType}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}, {v.state}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Commission: {v.commissionPct}%</span>
                        </div>
                        {v.ownerName && (
                          <p className="text-[10px] text-gray-300 mt-1.5">Owner: {v.ownerName} ({v.ownerEmail})</p>
                        )}
                        {v.approvedAt && (
                          <p className="text-[10px] text-emerald-500 mt-0.5">Approved: {new Date(v.approvedAt).toLocaleDateString("en-IN")}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {v.status !== "APPROVED" && (
                          <button
                            onClick={() => updateVendorStatus(v.id, "APPROVED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {v.status === "APPROVED" && (
                          <button
                            onClick={() => updateVendorStatus(v.id, "SUSPENDED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-bold transition-all"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}
                        {v.status !== "REJECTED" && v.status !== "APPROVED" && (
                          <button
                            onClick={() => updateVendorStatus(v.id, "REJECTED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
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

      {/* ── Add Vehicle Modal ── */}
      {showAddVehicle && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Vehicle (Admin CRM)</h2>
                <p className="text-xs text-gray-400">Directly add a vehicle to the fleet — auto-approved, usable in packages</p>
              </div>
              <button onClick={() => setShowAddVehicle(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Display Name *</label>
                  <input required value={newVehicle.name} onChange={e => setNewVehicle(v => ({ ...v, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="e.g. Toyota Innova Crysta 7-Seater Manali" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Type *</label>
                  <select value={newVehicle.type} onChange={e => setNewVehicle(v => ({ ...v, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] bg-white text-sm">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub-Type</label>
                  <input value={newVehicle.subType} onChange={e => setNewVehicle(v => ({ ...v, subType: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="e.g. SUV, Sedan, Volvo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Make (Brand) *</label>
                  <input required value={newVehicle.make} onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="Toyota, Volvo, Tata" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model *</label>
                  <input required value={newVehicle.model} onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="Innova Crysta, Volvo B11R" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seating Capacity *</label>
                  <input type="number" min={1} max={60} value={newVehicle.seatingCapacity} onChange={e => setNewVehicle(v => ({ ...v, seatingCapacity: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luggage Capacity (bags)</label>
                  <input type="number" min={0} value={newVehicle.luggageCapacity} onChange={e => setNewVehicle(v => ({ ...v, luggageCapacity: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Price / Day (₹)</label>
                  <input type="number" min={0} value={newVehicle.minPrice || ""} onChange={e => setNewVehicle(v => ({ ...v, minPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="e.g. 3500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price Per Km (₹)</label>
                  <input type="number" min={0} value={newVehicle.basePricePerKm || ""} onChange={e => setNewVehicle(v => ({ ...v, basePricePerKm: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="e.g. 12" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City / Region</label>
                  <input value={newVehicle.customCity} onChange={e => setNewVehicle(v => ({ ...v, customCity: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="Manali, Shimla, Delhi" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input type="checkbox" id="isAC" checked={newVehicle.isAC} onChange={e => setNewVehicle(v => ({ ...v, isAC: e.target.checked }))} className="w-5 h-5" />
                  <label htmlFor="isAC" className="text-sm font-medium text-gray-700">AC Vehicle</label>
                  <input type="checkbox" id="vFeatured" checked={newVehicle.isFeatured} onChange={e => setNewVehicle(v => ({ ...v, isFeatured: e.target.checked }))} className="w-5 h-5 ml-4" />
                  <label htmlFor="vFeatured" className="text-sm font-medium text-gray-700">Featured</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Publish Status</label>
                  <select value={newVehicle.status} onChange={e => setNewVehicle(v => ({ ...v, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] bg-white text-sm">
                    <option value="APPROVED">✅ Approved — Visible on site immediately</option>
                    <option value="PENDING">⏳ Pending — Requires review before going live</option>
                    <option value="DRAFT">📝 Draft — Save without publishing</option>
                  </select>
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">Admin-added vehicles are set to Approved by default — they appear on the website immediately.</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Features (comma-separated)</label>
                  <input value={newVehicle.features} onChange={e => setNewVehicle(v => ({ ...v, features: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="WIFI, CHARGING_PORT, GPS, MUSIC, RECLINER" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                  <textarea value={newVehicle.description} onChange={e => setNewVehicle(v => ({ ...v, description: e.target.value }))}
                    rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] text-sm" placeholder="Describe the vehicle experience..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URLs (one per line)</label>
                  <textarea value={newVehicle.images} onChange={e => setNewVehicle(v => ({ ...v, images: e.target.value }))}
                    rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B] font-mono text-xs" placeholder="https://..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddVehicle(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={addVehicleSaving} className="px-6 py-2.5 bg-[#1B3A6B] text-white text-sm font-bold rounded-xl hover:bg-[#0f2548] transition-colors disabled:opacity-60 flex items-center gap-2">
                  <Save className="w-4 h-4" />{addVehicleSaving ? "Saving..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vehicles Tab ── */}
      {activeTab === "vehicles" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-50">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search fleets, transporters, models..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white text-gray-800" />
            </div>
            <div className="flex gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 focus:outline-none">
                <option value="ALL">All Categories</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-800 focus:outline-none">
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Live</option>
                <option value="PENDING">Pending</option>
                <option value="DRAFT">Draft</option>
              </select>
              <button onClick={() => setShowAddVehicle(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl hover:bg-[#0f2548] transition-colors whitespace-nowrap">
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Fetching system assets...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredVehicles.map(v => (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        STATUS_CONFIG[v.status]?.bg || "bg-gray-100"
                      } ${STATUS_CONFIG[v.status]?.color || "text-gray-600"}`}>
                        {STATUS_CONFIG[v.status]?.label || v.status}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{v.type}</span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm mb-1">{v.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{v.make} {v.model} ({v.seatingCapacity} seats)</p>

                    <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{v.city_name || "Custom Region"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Transporter: <span className="font-semibold text-gray-700">{v.vendor_business_name_full || v.owner_name}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-sm font-black text-[#1B3A6B]">₹{v.minPrice || 0}</span>
                      <span className="text-[10px] text-gray-400">/day starting</span>
                    </div>
                    <button onClick={() => setSelectedVehicle(v)}
                      className="flex items-center gap-1 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">
                      <Eye className="w-3.5 h-3.5" /> Audit File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bookings Tab ── */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">Active Bookings Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold">
                  <th className="p-4">Ref</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Fare</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 text-gray-700">
                    <td className="p-4 font-mono font-bold text-gray-900">{b.bookingRef}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{b.vehicle_name}</p>
                      <p className="text-[10px] text-gray-400">{b.vehicle_type}</p>
                    </td>
                    <td className="p-4">{b.customer_name}</td>
                    <td className="p-4">
                      <p className="font-medium">{b.pickup_date}</p>
                      <p className="text-[10px] text-gray-400">{b.pickup_time}</p>
                    </td>
                    <td className="p-4 font-bold text-[#1B3A6B]">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.status === "CONFIRMED" ? "bg-green-50 text-green-700" :
                        b.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-1">
                      {b.status === "PENDING" && (
                        <>
                          <button onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateBookingStatus(b.id, "CANCELLED")}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Routes Tab ── */}
      {activeTab === "routes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50">
            <h3 className="text-xs font-bold text-gray-900">Standardized Intercity Transfer Routes</h3>
            <button onClick={() => setIsAddingRoute(true)}
              className="flex items-center gap-1.5 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Add Standard Route
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold">
                    <th className="p-4">From</th>
                    <th className="p-4">To</th>
                    <th className="p-4">Est. Distance</th>
                    <th className="p-4">Est. Duration</th>
                    <th className="p-4">Starting At</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routes.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 text-gray-700">
                      <td className="p-4 font-bold">{r.from}</td>
                      <td className="p-4 font-bold">{r.to}</td>
                      <td className="p-4">{r.distance} km</td>
                      <td className="p-4">{r.estimatedTime}</td>
                      <td className="p-4 font-semibold text-emerald-600">₹{r.startingPrice.toLocaleString()}</td>
                      <td className="p-4">
                        {r.isPopular ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700">Popular</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-50 text-gray-400">Regular</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Audit Modal ── */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Vehicle File Audit</h3>
                <p className="text-xs text-gray-400">Review status and verify registration docs</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <p className="font-bold text-gray-900">Make & Model</p>
                  <p>{selectedVehicle.make} {selectedVehicle.model}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Registration Number</p>
                  <p className="font-mono">{selectedVehicle.registrationNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Owner/Transporter</p>
                  <p>{selectedVehicle.vendor_business_name_full || selectedVehicle.owner_name}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pricing Base (KM / Day)</p>
                  <p>₹{selectedVehicle.basePricePerKm}/km | ₹{selectedVehicle.basePricePerDay}/day</p>
                </div>
              </div>

              {/* Status Update Control */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Modify Listing Approval State</p>
                  <p className="text-[10px] text-gray-400">Approved listings show up instantly on client search pages</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateVehicleStatus(selectedVehicle.id, "APPROVED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                    Approve
                  </button>
                  <button onClick={() => updateVehicleStatus(selectedVehicle.id, "REJECTED")}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                    Reject / Suspend
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Route Add Modal ── */}
      {isAddingRoute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddRoute} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">New Standard Transfer Route</h3>
              <button type="button" onClick={() => setIsAddingRoute(false)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">From City</label>
                  <input required value={newRoute.from} onChange={e => setNewRoute({...newRoute, from: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl" placeholder="e.g. Delhi" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">To City</label>
                  <input required value={newRoute.to} onChange={e => setNewRoute({...newRoute, to: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl" placeholder="e.g. Manali" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Distance (km)</label>
                  <input type="number" required value={newRoute.distance} onChange={e => setNewRoute({...newRoute, distance: Number(e.target.value)})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Starting Price (INR)</label>
                  <input type="number" required value={newRoute.startingPrice} onChange={e => setNewRoute({...newRoute, startingPrice: Number(e.target.value)})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Est. Duration</label>
                <input required value={newRoute.estimatedTime} onChange={e => setNewRoute({...newRoute, estimatedTime: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl" placeholder="e.g. 5h 30m" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="popular" checked={newRoute.isPopular} onChange={e => setNewRoute({...newRoute, isPopular: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]" />
                <label htmlFor="popular" className="font-bold text-gray-700">Mark as popular route</label>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingRoute(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 bg-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl">Save Route</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

