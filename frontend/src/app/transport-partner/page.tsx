"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { Truck, TrendingUp, Shield, Headphones, Star, ChevronRight, Users, MapPin, Wallet, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Boost Fleet Utilization",
    description: "Get direct passenger and corporate travel requests for Manali, Spiti, Shimla, and beyond. Keep your wheels turning.",
    color: "from-blue-600 to-indigo-700",
  },
  {
    icon: Shield,
    title: "Digital Vehicle Audits",
    description: "Maintain a verified safety checklist (brakes, tyres, GPS, fitness docs) to gain trust badges and win high-margin tour bookings.",
    color: "from-emerald-500 to-teal-700",
  },
  {
    icon: Wallet,
    title: "On-Time settlements",
    description: "Direct settlements to your corporate bank account. Clear statements for every toll, waiting hour, and driver allowance.",
    color: "from-violet-500 to-purple-700",
  },
  {
    icon: Headphones,
    title: "Logistical Support",
    description: "Our dedicated operations desk coordinates route delays, backup vehicles, and client handoffs smoothly.",
    color: "from-amber-500 to-orange-700",
  },
];

const STATS = [
  { value: "500+", label: "Verified Vehicles" },
  { value: "50,000+", label: "Completed Trips" },
  { value: "₹5 Cr+", label: "Transporter Payouts" },
  { value: "4.9★", label: "Client Satisfaction" },
];

const STEPS = [
  { num: "01", title: "Complete Business Profile", desc: "Fill in company info, GST, PAN, and link bank credentials in 2 minutes." },
  { num: "02", title: "Upload KYC & Permits", desc: "Upload clear scans of business registration, state permits, and driver credentials." },
  { num: "03", title: "Register Vehicles & Checklists", desc: "List vehicle specs, attach RC copies, and log our safety condition reports." },
  { num: "04", title: "Collect Bookings & Earn", desc: "Manage bookings via your console. Get paid weekly directly to your bank account." },
];

export default function TransportPartnerLandingPage() {
  const { login } = useVendorAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.push("/transport-partner/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-amber-500 selection:text-slate-900">
      {/* ── Header / Navigation ── */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-900 shadow-md">
              <Truck className="w-5.5 h-5.5 font-bold" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider uppercase block">Sampooran Logistics</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block -mt-1">Partner Network</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/transport-partner/register" className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all">
              Become a Transporter
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 pointer-events-none" />
        <div className="container mx-auto px-6 relative flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-full px-4.5 py-1.5 text-xs text-amber-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Leading Travel Logistics Network in the Himalayas
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
              List Your Fleets & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">Collect Direct Bookings</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Cabs, SUVs, Tempo Travellers, Bus Operators, and Luxury Fleets — connect with verified premium itineraries across Himachal Pradesh, Ladakh, and Uttarakhand.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/transport-partner/register"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-7 py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]">
                Start Onboarding <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── Login Form ── */}
          <div className="flex-1 w-full max-w-md bg-slate-950/80 border border-slate-800 p-8 rounded-3xl backdrop-blur">
            <h3 className="text-lg font-bold mb-1">Transporter Console Login</h3>
            <p className="text-xs text-slate-400 mb-6">Manage bookings, schedule fleet availability, and verify logs.</p>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Registered Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partner@agency.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-xs font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                ) : (
                  "Authenticate Console"
                )}
              </button>
              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500">Don&apos;t have an account? <Link href="/transport-partner/register" className="text-amber-400 font-bold hover:underline">Register Fleet</Link></span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-950/50 border-y border-slate-800/80 py-12">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl font-black text-amber-400">{s.value}</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 lg:py-28 container mx-auto px-6 space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black">Designed for Scale, Built for Trust</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Enjoy premium OTA tools to streamline operations, optimize routing, and increase daily revenue logs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-slate-950/50 border border-slate-850 p-6 rounded-3xl hover:border-slate-800 transition-all space-y-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${b.color} flex items-center justify-center text-white`}>
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">{b.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Step Walkthrough ── */}
      <section className="bg-slate-950/40 border-t border-slate-850 py-20 lg:py-28">
        <div className="container mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black">transporter onboarding loop</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Follow our onboarding sequence to verify your company documents, declare your vehicle range, and launch listings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="space-y-4 relative">
                <span className="text-5xl font-black text-slate-800/80 block">{s.num}</span>
                <h3 className="font-bold text-sm text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
