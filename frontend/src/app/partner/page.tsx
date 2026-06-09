"use client";
import Link from "next/link";
import { Building2, TrendingUp, Shield, Headphones, Star, ChevronRight, Users, MapPin, Wallet, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Grow Your Revenue",
    description: "Reach thousands of travellers planning Himalayan getaways. Our platform drives bookings 24/7.",
    color: "from-blue-500 to-blue-700",
  },
  {
    icon: Shield,
    title: "Verified & Trusted",
    description: "Get a verified badge that builds customer trust and boosts your listing in search results.",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    icon: Wallet,
    title: "Transparent Payouts",
    description: "Weekly settlements directly to your bank. Track every booking, earning, and payout in real-time.",
    color: "from-violet-500 to-violet-700",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Our partner success team is available to help you onboard, optimize listings, and resolve issues fast.",
    color: "from-amber-500 to-amber-700",
  },
];

const STATS = [
  { value: "50,000+", label: "Monthly Travellers" },
  { value: "1,200+", label: "Properties Listed" },
  { value: "₹2.5 Cr+", label: "Paid to Partners Monthly" },
  { value: "4.8★", label: "Average Property Rating" },
];

const STEPS = [
  { num: "01", title: "Register Your Account", desc: "Create your free vendor account with your business details in under 2 minutes." },
  { num: "02", title: "List Your Property", desc: "Add photos, rooms, pricing, and amenities. Our step-by-step form makes it easy." },
  { num: "03", title: "Get Approved & Go Live", desc: "Our team reviews your listing within 24 hours. Once approved, you start receiving bookings." },
  { num: "04", title: "Manage & Earn", desc: "Use the dashboard to manage inventory, update rates, respond to guests, and track revenue." },
];

export default function PartnerLandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-[#0B1F4E] via-[#1B3A6B] to-[#0f2f5a] text-white overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F5A623]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
              <span className="font-semibold">Trusted by 1,200+ Properties across the Himalayas</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-5">
              List Your Property on<br />
              <span className="text-[#F5A623]">Sampooran Holidays</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Hotels, Resorts, Cottages, Homestays, Camps — reach thousands of travellers planning their Himalayan dream holiday. Free to join, no setup fees.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner/register"
                className="flex items-center gap-2 bg-[#F5A623] hover:bg-amber-500 text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/partner/login"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 font-semibold px-7 py-4 rounded-2xl transition-all">
                Already a Partner? Login
              </Link>
            </div>
          </div>

          {/* Property type cards */}
          <div className="flex-1 grid grid-cols-2 gap-4 max-w-md w-full">
            {["Hotel", "Resort", "Cottage", "Homestay", "Villa", "Camp"].map((type, i) => (
              <div key={type}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/20 transition-all cursor-default">
                <div className="w-10 h-10 bg-[#F5A623]/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#F5A623]" />
                </div>
                <span className="font-bold text-sm">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#F5A623] py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-2xl lg:text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/80 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Why Partner With Us?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to grow your hospitality business — technology, reach, and support all in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100">
                <div className={`w-14 h-14 bg-gradient-to-br ${b.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <b.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Get your property listed and start earning in 4 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-100 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1B3A6B] to-[#0f2548] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
                    <span className="text-white font-black text-sm">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-[#0B1F4E] to-[#1B3A6B] text-white text-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl font-black mb-4">Ready to Grow Your Business?</h2>
          <p className="text-white/70 mb-8">Join hundreds of properties already earning with Sampooran Holidays.</p>
          <Link href="/partner/register"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-amber-500 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all hover:scale-105">
            List Your Property <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/40 text-sm mt-4">Free to join · No upfront fees · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer link ── */}
      <div className="bg-gray-50 py-6 text-center text-sm text-gray-400 border-t">
        Already a partner?{" "}
        <Link href="/partner/login" className="text-[#1B3A6B] font-bold hover:underline">Sign in to your dashboard</Link>
        {" · "}
        <Link href="/" className="text-[#1B3A6B] hover:underline">← Back to Sampooran Holidays</Link>
      </div>
    </div>
  );
}
