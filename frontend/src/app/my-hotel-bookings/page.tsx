"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Building2, Calendar, Users, Bed, CheckCircle, Clock,
  XCircle, AlertCircle, ChevronRight, ExternalLink, Star,
  Wallet, CreditCard, MapPin, ArrowRight, RefreshCw, Hotel
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const STATUS_STYLES: Record<string, { label: string; className: string; icon: any }> = {
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  PENDING:   { label: "Pending",   className: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200",         icon: XCircle },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700 border-blue-200",       icon: CheckCircle },
};

export default function MyHotelBookingsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/my-hotel-bookings");
      return;
    }
    if (!user || !token) return;

    const API_TOKEN = token || localStorage.getItem("sh_token");
    fetch(`${API_BASE}/hotels/my-bookings`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setBookings(d);
        else setError("Failed to load bookings.");
      })
      .catch(() => setError("Could not connect to server."))
      .finally(() => setLoading(false));
  }, [user, token, authLoading, router]);

  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8" />
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl h-40 animate-pulse border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Hotel className="w-6 h-6 text-primary" /> My Hotel Bookings
            </h1>
            <p className="text-slate-400 text-sm mt-1">All your hotel stays in one place</p>
          </div>
          <Link href="/hotels"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            Book a Stay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 mb-6 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            <button onClick={() => window.location.reload()} className="ml-auto flex items-center gap-1 text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {bookings.length === 0 && !loading && !error && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">No Hotel Bookings Yet</h2>
            <p className="text-slate-400 text-sm mb-6">Start exploring hotels and make your first booking.</p>
            <Link href="/hotels"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Explore Hotels <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
            const StatusIcon = status.icon;
            const checkInDate = booking.travelDate ? new Date(booking.travelDate) : null;

            return (
              <div key={booking.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Top colored bar based on status */}
                <div className={cn("h-1", {
                  "bg-emerald-500": booking.status === "CONFIRMED",
                  "bg-amber-400": booking.status === "PENDING",
                  "bg-red-400": booking.status === "CANCELLED",
                  "bg-blue-500": booking.status === "COMPLETED",
                })} />

                <div className="p-5">
                  <div className="flex gap-4 items-start">
                    {/* Hotel image */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                      {booking.hotelImages?.[0]
                        ? <img src={booking.hotelImages[0]} alt={booking.hotelName} className="w-full h-full object-cover" />
                        : <Building2 className="w-8 h-8 text-slate-300 m-auto mt-5" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-black text-slate-900 leading-tight text-base line-clamp-1">
                            {booking.hotelName || "Hotel"}
                          </h2>
                          {booking.hotelCity && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {booking.hotelCity}
                            </p>
                          )}
                        </div>
                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0", status.className)}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Check-in */}
                        <div className="flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Check-in</p>
                            <p className="text-xs font-bold text-slate-700">
                              {checkInDate
                                ? checkInDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Room */}
                        {booking.roomName && (
                          <div className="flex items-start gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Room</p>
                              <p className="text-xs font-bold text-slate-700 line-clamp-1">{booking.roomName}</p>
                            </div>
                          </div>
                        )}

                        {/* Guests */}
                        <div className="flex items-start gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Guests</p>
                            <p className="text-xs font-bold text-slate-700">{booking.travelersCount || 1}</p>
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="flex items-start gap-1.5">
                          {booking.paymentStatus === "PAID" ? <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> : <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Amount</p>
                            <p className="text-xs font-black text-primary">₹{Number(booking.totalAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">
                      Booking Ref: <span className="font-mono font-bold text-slate-600">#{String(booking.id).padStart(6, "0")}</span>
                      <span className="mx-2">·</span>
                      {booking.paymentStatus === "PAID" ? (
                        <span className="text-emerald-600 font-semibold">✓ Paid Online</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Pay at Hotel</span>
                      )}
                    </div>
                    {booking.hotelSlug && (
                      <Link href={`/hotels/${booking.hotelSlug}`}
                        className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
                        View Hotel <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA for more hotels */}
        {bookings.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/hotels"
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
              <Star className="w-4 h-4" /> Browse more hotels
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
