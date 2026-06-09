"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useVendorAuth } from "@/context/VendorAuthContext";
import {
  Calendar, Users, Building2, BedDouble, ArrowRight, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, Search, Filter,
  ChevronDown, Phone, Mail, Download, Eye
} from "lucide-react";

import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

interface Booking {
  id: number;
  status: string;
  paymentStatus: string;
  travelDate: string;
  totalAmount: number;
  specialRequests?: string;
  travelersCount: number;
  createdAt: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  hotelName?: string;
  hotelSlug?: string;
  hotelCity?: string;
  roomName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING:   { label: "Pending",   color: "text-amber-700",  icon: Clock,         bg: "bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Confirmed", color: "text-emerald-700",icon: CheckCircle2,  bg: "bg-emerald-50 border-emerald-200" },
  CANCELLED: { label: "Cancelled", color: "text-red-700",    icon: XCircle,       bg: "bg-red-50 border-red-200" },
  COMPLETED: { label: "Completed", color: "text-blue-700",   icon: CheckCircle2,  bg: "bg-blue-50 border-blue-200" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Unpaid",    color: "text-amber-600" },
  PAID:    { label: "Paid",      color: "text-emerald-600" },
  PARTIAL: { label: "Partial",   color: "text-blue-600" },
  REFUNDED:{ label: "Refunded",  color: "text-slate-500" },
};

export default function VendorBookingsPage() {
  const { vendor, token } = useVendorAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/vendor/hotel-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data);
    } catch (e: any) {
      setError(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (bookingId: number, newStatus: string) => {
    if (!token) return;
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`${API_BASE}/vendor/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      }
    } catch {}
    finally { setUpdatingId(null); }
  };

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchSearch = !search || 
      b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      b.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "PENDING").length,
    confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
    revenue: bookings.filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((s, b) => s + (b.totalAmount || 0), 0),
  };

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">Please log in to view bookings.</p>
          <Link href="/partner/login" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-xl font-bold">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Booking Management</h1>
            <p className="text-slate-500 mt-1">Manage all your property bookings in one place</p>
          </div>
          <button onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: stats.total, color: "text-slate-900", icon: Calendar },
            { label: "Pending",        value: stats.pending, color: "text-amber-600", icon: Clock },
            { label: "Confirmed",      value: stats.confirmed, color: "text-emerald-600", icon: CheckCircle2 },
            { label: "Revenue",        value: `₹${stats.revenue.toLocaleString()}`, color: "text-primary", icon: Download },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color} opacity-60`} />
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by guest name, hotel, booking ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                  statusFilter === s ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}>
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-red-700">{error}</p>
            <button onClick={fetchBookings} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-700 mb-2">No bookings found</h3>
            <p className="text-slate-400 text-sm">
              {statusFilter !== "ALL" ? `No ${statusFilter.toLowerCase()} bookings.` : "Bookings will appear here when guests book your properties."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => {
              const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
              const payment = PAYMENT_CONFIG[booking.paymentStatus] || PAYMENT_CONFIG.PENDING;
              const StatusIcon = status.icon;

              return (
                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Booking Info */}
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border ${status.bg}`}>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900">#{booking.id}</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${status.bg} ${status.color} uppercase tracking-wide`}>
                              {status.label}
                            </span>
                            <span className={`text-[10px] font-bold ${payment.color}`}>
                              {payment.label}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">{booking.hotelName || "Hotel Booking"}</p>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                            {booking.roomName && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3 h-3" /> {booking.roomName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {booking.checkIn || (booking.travelDate ? new Date(booking.travelDate).toLocaleDateString("en-IN") : "—")}
                              {booking.checkOut ? ` → ${booking.checkOut}` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {booking.travelersCount} guests
                            </span>
                          </div>
                          {booking.guestName && (
                            <p className="text-xs text-slate-500 mt-1">
                              Guest: <span className="font-bold text-slate-700">{booking.guestName}</span>
                              {booking.guestPhone && <span> · {booking.guestPhone}</span>}
                            </p>
                          )}
                          {booking.specialRequests && (
                            <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">
                              Note: {booking.specialRequests}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Amount + Actions */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Total Amount</p>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2">
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(booking.id, "CONFIRMED")}
                                disabled={updatingId === booking.id}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                                {updatingId === booking.id ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => updateStatus(booking.id, "CANCELLED")}
                                disabled={updatingId === booking.id}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                                Decline
                              </button>
                            </>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => updateStatus(booking.id, "COMPLETED")}
                              disabled={updatingId === booking.id}
                              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                              {updatingId === booking.id ? "..." : "Mark Complete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
