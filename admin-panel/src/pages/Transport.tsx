import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Plus, Trash2, Edit3, Search, Filter, MapPin, CheckCircle, XCircle,
  Truck, LayoutGrid, List, RefreshCw, Eye, Ban,
  Users, Wallet, BookOpen, Shield, ChevronDown, ChevronUp, X,
  Save, Camera, Clock, Phone, Globe, Mail, AlertTriangle, TrendingUp, Info, DollarSign
} from "lucide-react";
import { getApiUrl } from "@/utils/api-url";

const API_URL = getApiUrl();

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("sh_admin_token") || "{}").token; }
  catch { return ""; }
};

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

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
  vendor_business_name?: string;
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
  const [activeTab, setActiveTab] = useState<"vehicles" | "bookings" | "routes" | "dashboard">("dashboard");
  const [stats, setStats] = useState<any>({
    totalVehicles: 0,
    approvedVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthRevenue: 0,
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [loading, setLoading] = useState(false);
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/transport/dashboard`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vendor/transport/vehicles`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/transport/bookings`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transport/routes`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (activeTab === "vehicles") fetchVehicles();
    if (activeTab === "bookings") fetchBookings();
    if (activeTab === "routes") fetchRoutes();
  }, [activeTab, fetchStats, fetchVehicles, fetchBookings, fetchRoutes]);

  const updateVehicleStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/vendor/transport/vehicles/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
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
                        (v.vendor_business_name && v.vendor_business_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType === "ALL" || v.type === filterType;
    const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <AdminLayout title="Transport Fleet Manager" subtitle="Approve listings, audit vehicle condition reports, & manage routes">
      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-100 mb-6 pb-px overflow-x-auto">
        <button onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "dashboard" ? "border-[#1B3A6B] text-[#1B3A6B]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}>
          Overview
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
                <p className="text-2xl font-black text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">Lifetime Sales</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">₹{stats.monthRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 font-medium">This Month</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Enterprise Insights</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
              Monitor active logistics, audit safety certifications, verify transporter commercial driver permits, and adjust platform commission policies globally or per transporter.
            </p>
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
                        <span>Transporter: <span className="font-semibold text-gray-700">{v.vendor_business_name || v.owner_name}</span></span>
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
                  <p>{selectedVehicle.vendor_business_name || selectedVehicle.owner_name}</p>
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
