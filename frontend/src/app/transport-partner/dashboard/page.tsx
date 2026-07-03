"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Calendar, Users, Wallet, Plus, Eye, CheckCircle2, AlertTriangle,
  FolderLock, RefreshCw, XCircle, UserCheck, ShieldAlert, LogOut, LayoutDashboard
} from "lucide-react";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { API_BASE } from "@/context/AuthContext";

interface Vehicle {
  id: number;
  name: string;
  type: string;
  make: string;
  model: string;
  seatingCapacity: number;
  minPrice: number;
  status: string;
  registrationNumber?: string;
}

interface Booking {
  id: number;
  bookingRef: string;
  vehicle_name: string;
  customer_name: string;
  pickup_date: string;
  pickup_time: string;
  pickup_address: string;
  drop_address: string;
  totalAmount: number;
  status: string;
}

export default function TransporterDashboard() {
  const router = useRouter();
  const { vendor, token, logout } = useVendorAuth();
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "fleet" | "bookings" | "drivers">("dashboard");
  const [stats, setStats] = useState({
    totalVehicles: 0,
    approvedVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    recentBookings: [] as Booking[],
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "CAB",
    make: "",
    model: "",
    year: "2023",
    color: "",
    registrationNumber: "",
    seatingCapacity: "4",
    basePricePerDay: "3500",
    basePricePerKm: "14",
    isAC: true,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/vehicles`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/bookings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.push("/transport-partner");
      return;
    }
    fetchStats();
    if (activeTab === "fleet") fetchVehicles();
    if (activeTab === "bookings") fetchBookings();
  }, [activeTab, token, fetchStats, fetchVehicles, fetchBookings, router]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/vehicles`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newVehicle.name || `${newVehicle.make} ${newVehicle.model}`,
          type: newVehicle.type,
          make: newVehicle.make,
          model: newVehicle.model,
          year: Number(newVehicle.year),
          color: newVehicle.color,
          registrationNumber: newVehicle.registrationNumber,
          seatingCapacity: Number(newVehicle.seatingCapacity),
          basePricePerDay: Number(newVehicle.basePricePerDay),
          basePricePerKm: Number(newVehicle.basePricePerKm),
          isAC: newVehicle.isAC,
        }),
      });
      if (res.ok) {
        fetchVehicles();
        setAddingVehicle(false);
        setNewVehicle({
          name: "", type: "CAB", make: "", model: "", year: "2023", color: "",
          registrationNumber: "", seatingCapacity: "4", basePricePerDay: "3500",
          basePricePerKm: "14", isAC: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateBooking = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/vendor/transport/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

  const handleLogout = () => {
    logout();
    router.push("/transport-partner");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xs block uppercase">Logistics Console</span>
              <span className="text-[10px] text-amber-400 block uppercase font-bold">Partner Console</span>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: "dashboard", icon: LayoutDashboard, label: "Console Stats" },
              { id: "fleet", icon: Truck, label: "Fleet Registry" },
              { id: "bookings", icon: Calendar, label: "Passenger Trips" }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}>
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 text-xs font-bold transition-all">
          <LogOut className="w-4 h-4" />
          <span>Exit Console</span>
        </button>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 p-8 space-y-6 max-h-screen overflow-y-auto">
        <header className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black">Transporter Control Panel</h1>
            <p className="text-xs text-slate-400 font-medium">Transporter: <span className="text-white font-bold">{vendor?.vendorBusinessName || "Fleet Partner"}</span></p>
          </div>
          {activeTab === "fleet" && (
            <button onClick={() => setAddingVehicle(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Add Fleet Vehicle
            </button>
          )}
        </header>

        {/* ── Tab: Dashboard Stats ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Truck className="w-5.5 h-5.5" /></div>
                <div>
                  <p className="text-xl font-black text-white">{stats.totalVehicles}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Registered Fleets</p>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center"><ShieldAlert className="w-5.5 h-5.5" /></div>
                <div>
                  <p className="text-xl font-black text-white">{stats.pendingBookings}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Pending Confirmation</p>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Wallet className="w-5.5 h-5.5" /></div>
                <div>
                  <p className="text-xl font-black text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Lifetime Earnings</p>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center"><UserCheck className="w-5.5 h-5.5" /></div>
                <div>
                  <p className="text-xl font-black text-white">₹{stats.monthRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">This Month</p>
                </div>
              </div>
            </div>

            {/* Recent Trips */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Latest Pickups & Drops</h3>
              {stats.recentBookings.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No active bookings yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentBookings.map((b) => (
                    <div key={b.id} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-4 rounded-xl">
                      <div className="space-y-1">
                        <span className="font-bold text-white block">{b.vehicle_name}</span>
                        <span className="text-[10px] text-slate-400 block">{b.pickup_address} → {b.drop_address}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-400 block">₹{b.totalAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">{b.pickup_date} at {b.pickup_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Fleet Registry ── */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Syncing logistics registry...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {vehicles.map(v => (
                  <div key={v.id} className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                          v.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                        }`}>{v.status}</span>
                        <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{v.type}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 mb-3">{v.make} {v.model} • {v.seatingCapacity} Passengers</p>
                      {v.registrationNumber && (
                        <p className="font-mono text-slate-400 mb-3">RC: {v.registrationNumber}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                      <span className="font-black text-amber-400">₹{v.minPrice || 0}/day</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Bookings ── */}
        {activeTab === "bookings" && (
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-bold">
                    <th className="p-4">Ref</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-900/50">
                      <td className="p-4 font-mono font-bold text-white">{b.bookingRef}</td>
                      <td className="p-4">{b.vehicle_name}</td>
                      <td className="p-4">{b.customer_name}</td>
                      <td className="p-4">
                        <p className="font-bold text-white">{b.pickup_date}</p>
                        <p className="text-[10px] text-slate-400">{b.pickup_time}</p>
                      </td>
                      <td className="p-4 font-bold text-amber-400">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          b.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400" :
                          b.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                        }`}>{b.status}</span>
                      </td>
                      <td className="p-4 flex gap-1">
                        {b.status === "PENDING" && (
                          <>
                            <button onClick={() => updateBooking(b.id, "CONFIRMED")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Confirm</button>
                            <button onClick={() => updateBooking(b.id, "CANCELLED")}
                              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Reject</button>
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

      </main>

      {/* ── Add Vehicle Modal ── */}
      {addingVehicle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateVehicle} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Add Vehicle to Fleet</h3>
              <button type="button" onClick={() => setAddingVehicle(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Make</label>
                  <input required value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                    placeholder="e.g. Toyota" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Model</label>
                  <input required value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                    placeholder="e.g. Innova Crysta" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                    <option value="CAB">Cab</option>
                    <option value="TEMPO_TRAVELLER">Tempo Traveller</option>
                    <option value="BUS">Bus</option>
                    <option value="LUXURY">Luxury car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Seating Capacity</label>
                  <input type="number" required value={newVehicle.seatingCapacity} onChange={e => setNewVehicle({...newVehicle, seatingCapacity: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Base Price / Day</label>
                  <input type="number" required value={newVehicle.basePricePerDay} onChange={e => setNewVehicle({...newVehicle, basePricePerDay: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Price / KM</label>
                  <input type="number" required value={newVehicle.basePricePerKm} onChange={e => setNewVehicle({...newVehicle, basePricePerKm: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Registration Number</label>
                <input required value={newVehicle.registrationNumber} onChange={e => setNewVehicle({...newVehicle, registrationNumber: e.target.value})}
                  placeholder="e.g. HP-01-A-1234" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono" />
              </div>
            </div>
            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setAddingVehicle(false)} className="px-4 py-2 border border-slate-800 rounded-xl font-bold text-slate-400 bg-transparent">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl">Register Vehicle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
