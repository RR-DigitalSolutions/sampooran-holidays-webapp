import React from "react";
import Link from "next/link";
import { ArrowRight, Building, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function VendorCTA() {
  return (
    <section className="py-12 bg-[#1B3A6B] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 vendor-cta-bg-pattern" />
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#ff8f00]/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[#ff8f00]/15 text-[#ff8f00] text-[11px] font-black tracking-widest uppercase mb-3 border border-[#ff8f00]/25">
              For Hotel Partners
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
              List Your Property on <span className="text-[#ff8f00]">Sampooran Holidays</span>
            </h2>
            <p className="text-slate-200 text-base mb-6 max-w-xl mx-auto lg:mx-0">
              Join trusted hotel partners and grow your bookings with a professional hospitality platform built for fast approvals and secure payouts.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 text-white/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold">Reach</p>
                  <p className="font-semibold text-white">Global Audience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold">Growth</p>
                  <p className="font-semibold text-white">More Bookings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold">Trust</p>
                  <p className="font-semibold text-white">Secure Payments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center">
            <div className="bg-white p-6 md:p-8 rounded-[1.75rem] shadow-lg text-center max-w-sm w-full relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#ff8f00] rounded-xl flex items-center justify-center shadow-lg rotate-12">
                <Building className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#1B3A6B] mt-5 mb-2">Ready to grow?</h3>
              <p className="text-slate-500 text-sm mb-5">
                Registration takes less than 5 minutes. Start receiving bookings instantly upon approval.
              </p>
              <Link href="/partner/register" className="block w-full">
                <button className="w-full py-3.5 rounded-xl bg-[#1B3A6B] hover:bg-[#142A4D] text-white font-bold text-sm uppercase tracking-[0.16em] transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 group">
                  Register as Vendor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <div className="mt-3 text-xs font-medium text-slate-500">
                Already a partner? <Link href="/partner/login" className="text-[#1B3A6B] font-semibold hover:underline">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
