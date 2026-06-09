"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Users, Bed, ShieldCheck, CheckCircle, AlertTriangle,
  Lock, ArrowLeft, ChevronRight, Building2, MapPin, Star,
  CreditCard, Wallet, Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";

const API_BASE = getApiUrl();

const PAYMENT_METHODS = [
  { id: "PAY_AT_HOTEL", label: "Pay at Hotel", desc: "No payment now, pay during check-in", icon: Wallet, badge: "Most Popular" },
  { id: "ONLINE", label: "Pay Online Now", desc: "UPI, Cards, Net Banking — Instant confirmation", icon: CreditCard, badge: null },
];

interface RoomConfig {
  adults: number;
  children: number;
}

export default function BookHotelPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const slug = params.slug as string;

  const [hotel, setHotel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  // Parse check-in, check-out, and rooms configuration from URL query params
  const [checkIn, setCheckIn] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("checkIn");
      if (p) return p;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const [checkOut, setCheckOut] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("checkOut");
      if (p) return p;
    }
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("rooms");
      if (p) {
        try {
          const parsed = JSON.parse(decodeURIComponent(p));
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to parse rooms query param", e);
        }
      }
    }
    return [{ adults: 2, children: 0 }];
  });

  const [form, setForm] = useState({
    specialRequests: "",
    paymentMethod: "PAY_AT_HOTEL",
    guestName: user?.name || "",
    guestEmail: user?.email || "",
    guestPhone: user?.phone || user?.phoneNumber || "",
  });

  const roomId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("roomId")
    : null;

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/hotels/${slug}`)
      .then(r => r.json())
      .then(d => {
        setHotel(d);
        if (roomId && d.rooms) {
          const r = d.rooms.find((r: any) => r.id === Number(roomId));
          setRoom(r || d.rooms[0] || null);
        } else if (d.rooms?.length) {
          setRoom(d.rooms[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, roomId]);

  useEffect(() => {
    if (user) {
      setForm(f => ({ 
        ...f, 
        guestName: user.name || "", 
        guestEmail: user.email || "",
        guestPhone: user.phone || user.phoneNumber || ""
      }));
    }
  }, [user]);

  const updateField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  // Dynamic Occupancy Surcharge Price Calculator
  const calculateTotalSubtotal = () => {
    if (!room) return 0;
    let total = 0;
    const baseRoomPrice = room.basePrice;

    for (const config of roomsConfig) {
      let dailyPrice = baseRoomPrice;
      if (config.adults > 2) {
        dailyPrice += (config.adults - 2) * (room.extraAdultPrice || 0);
      }
      if (config.children > 0) {
        dailyPrice += config.children * (room.extraChildPrice || 0);
      }
      total += dailyPrice * nights;
    }
    return total;
  };

  const subtotal = calculateTotalSubtotal();
  const taxes = Math.round(subtotal * 0.12); // 12% GST
  const totalAmount = subtotal + taxes;

  const totalGuests = roomsConfig.reduce((acc, c) => acc + c.adults + c.children, 0);

  const handleSubmit = async () => {
    setError("");
    if (!checkIn || !checkOut) { setError("Please select check-in and check-out dates."); return; }
    if (!form.guestName || !form.guestEmail) { setError("Please fill in your name and email."); return; }
    if (nights < 1) { setError("Check-out must be after check-in."); return; }

    if (!user) {
      const redirectUrl = `/hotels/${slug}/book?roomId=${roomId || ""}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${encodeURIComponent(JSON.stringify(roomsConfig))}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setSubmitting(true);
    try {
      const API_TOKEN = token || localStorage.getItem("sh_token");
      const res = await fetch(`${API_BASE}/hotels/${slug}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          roomId: room?.id,
          checkIn,
          checkOut,
          guests: totalGuests,
          rooms: roomsConfig.length,
          roomsConfig, // Send full array for date-level check & storage
          totalAmount,
          specialRequests: form.specialRequests,
          paymentMethod: form.paymentMethod,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setSuccess(data);
      toast.success("Hotel room booked successfully!");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      toast.error(e.message || "Booking request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-bold">Reviewing room options...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">Hotel not found.</p>
          <Link href="/hotels" className="mt-3 inline-block text-[#1B3A6B] font-bold hover:underline text-sm">← Back to Hotels</Link>
        </div>
      </div>
    );
  }

  // ── Booking Confirmed Screen ──
  if (success) {
    const isInstant = success.status === "CONFIRMED";
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-lg">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5",
              isInstant ? "bg-emerald-50" : "bg-amber-50"
            )}>
              {isInstant
                ? <CheckCircle className="w-10 h-10 text-emerald-500" />
                : <Users className="w-10 h-10 text-amber-500" />
              }
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {isInstant ? "Booking Confirmed!" : "Booking Request Sent!"}
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              {isInstant
                ? "Your stay is reserved. A confirmation email has been sent details."
                : "The property desk will review and confirm this within 24 hours."
              }
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 text-left mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Booking Ref</span>
                <span className="font-black font-mono text-primary">#{String(success.id).padStart(6, "0")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Hotel</span>
                <span className="font-semibold text-slate-800">{success.hotelName || hotel.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Room Type</span>
                <span className="font-semibold text-slate-800">{success.roomName || room?.name || "Standard Room"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Dates</span>
                <span className="font-semibold text-slate-800">{new Date(checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Occupancy Detail</span>
                <span className="font-semibold text-slate-800">{roomsConfig.length} Room{roomsConfig.length > 1 ? "s" : ""} · {totalGuests} Guest{totalGuests > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100">
                <span>Total Paid</span>
                <span className="text-[#1B3A6B]">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/my-bookings"
                className="w-full py-3 bg-[#1B3A6B] text-white rounded-2xl font-bold text-sm hover:bg-[#0f2548] transition-colors">
                View My Bookings
              </Link>
              <Link href="/hotels"
                className="w-full py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                Browse More Hotels
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 pt-4">
          <Link href="/hotels" className="hover:text-primary">Hotels</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/hotels/${slug}`} className="hover:text-primary line-clamp-1">{hotel.name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-semibold">Confirm Stay Booking</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Booking Details ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hotel Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 flex gap-4 items-start shadow-xs">
              <div className="w-20 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                {hotel.images?.[0]
                  ? <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                  : <Building2 className="w-8 h-8 text-slate-300 m-auto mt-3" />}
              </div>
              <div>
                <h1 className="font-black text-slate-900 leading-tight">{hotel.name}</h1>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                  <span className="text-xs text-slate-400 ml-1">{hotel.type}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-400" /> {hotel.city}</p>
              </div>
              <Link href={`/hotels/${slug}`}
                className="ml-auto text-xs text-[#1B3A6B] font-bold hover:underline flex items-center gap-1 shrink-0">
                <ArrowLeft className="w-3 h-3" /> Change
              </Link>
            </div>

            {/* Occupied configuration summary */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1B3A6B]" /> Selected Guest Occupancy Config
              </h2>
              <div className="divide-y divide-slate-100">
                {roomsConfig.map((config, index) => (
                  <div key={index} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700">Room {index + 1}</p>
                      <p className="text-slate-400 mt-0.5">{config.adults} Adults · {config.children} Kids</p>
                    </div>
                    {room && (
                      <div className="text-right">
                        {config.adults > 2 && (
                          <p className="text-[10px] text-amber-600 font-semibold">+{(config.adults - 2)} Extra Adult Surcharge</p>
                        )}
                        {config.children > 0 && (
                          <p className="text-[10px] text-amber-600 font-semibold">+{config.children} Kid Surcharge</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stay Date range summary */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
              <h2 className="font-bold text-slate-900 text-sm mb-4">Stay Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Check-in Date</p>
                  <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1B3A6B]" />
                    {new Date(checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Check-out Date</p>
                  <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1B3A6B]" />
                    {new Date(checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1B3A6B] shrink-0" />
                <span className="text-xs font-semibold text-slate-600">Total Length of Stay: <span className="font-black text-[#1B3A6B]">{nights} Night{nights > 1 ? "s" : ""}</span></span>
              </div>
            </div>

            {/* Guest details form */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
              <h2 className="font-bold text-slate-900 text-sm mb-4">Guest Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Full Name *</label>
                  <input value={form.guestName} onChange={e => updateField("guestName", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="As shown on ID proof" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email Address *</label>
                  <input type="email" value={form.guestEmail} onChange={e => updateField("guestEmail", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Voucher details will be sent here" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone Number *</label>
                  <input type="tel" value={form.guestPhone} onChange={e => updateField("guestPhone", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Special Requests (Optional)</label>
                  <textarea value={form.specialRequests} onChange={e => updateField("specialRequests", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    rows={2} placeholder="e.g., Early check-in, ground floor room, specific dietary needs..." />
                </div>
              </div>
            </div>

            {/* Payment options */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
              <h2 className="font-bold text-slate-900 text-sm mb-4">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(method => (
                  <button key={method.id} onClick={() => updateField("paymentMethod", method.id)}
                    className={cn("relative text-left p-4 rounded-2xl border-2 transition-all",
                      form.paymentMethod === method.id ? "border-[#1B3A6B] bg-sky-50/10" : "border-slate-100 hover:border-slate-200")}>
                    {method.badge && (
                      <span className="absolute top-2.5 right-2.5 text-[8px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                        {method.badge}
                      </span>
                    )}
                    <method.icon className={cn("w-5 h-5 mb-2", form.paymentMethod === method.id ? "text-[#1B3A6B]" : "text-slate-400")} />
                    <p className={cn("text-xs font-black", form.paymentMethod === method.id ? "text-[#1B3A6B]" : "text-slate-700")}>{method.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* ── Right: Checkout Summary ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sticky top-24 space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-900 text-sm">Billing Breakdown</h2>

              {room && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-black text-xs text-slate-800">{room.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{room.type} · Max adults {room.maxAdults || room.maxOccupancy} · {room.bedType} Bed</p>
                </div>
              )}

              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Room Stay Charge (including occupancy surcharges)</span>
                  <span className="font-bold text-slate-700">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>GST & Tourism Taxes (12%)</span>
                  <span className="font-bold text-slate-700">₹{taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t border-slate-100 pt-3 mt-3">
                  <span className="text-slate-800">Grand Total Amount</span>
                  <span className="text-[#1B3A6B] text-sm">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {hotel.bookingType === "INSTANT" && (
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> Instant Booking — room reserved immediately.
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3.5 bg-[#1B3A6B] text-white rounded-2xl font-black text-xs hover:bg-[#0f2548] active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying availability...</>
                ) : (
                  <><Lock className="w-4 h-4" /> {user ? "Confirm Booking Stay" : "Login & Book Now"}</>
                )}
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Secure checkouts · No booking markup · Free cancellation rules apply.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
