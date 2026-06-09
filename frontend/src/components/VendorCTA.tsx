import React from "react";
import Link from "next/link";
import { ArrowRight, Building, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function VendorCTA() {
  return (
    <section className="py-16 bg-[#1B3A6B] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ff8f00]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          
          <div className="max-w-2xl text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#ff8f00]/20 text-[#ff8f00] text-xs font-black tracking-widest uppercase mb-4 border border-[#ff8f00]/30">
              For Hotel Partners
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              List Your Property on <span className="text-[#ff8f00]">Sampooran Holidays</span>
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto lg:mx-0">
              Join thousands of trusted hotel partners. Reach millions of travelers, increase your bookings, and grow your business with our zero-hassle platform.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-200 uppercase tracking-wider font-bold">Reach</p>
                  <p className="font-bold">Global Audience</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-200 uppercase tracking-wider font-bold">Growth</p>
                  <p className="font-bold">More Bookings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#ff8f00]" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-200 uppercase tracking-wider font-bold">Trust</p>
                  <p className="font-bold">Secure Payments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#ff8f00] rounded-xl flex items-center justify-center shadow-lg rotate-12">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#1B3A6B] mt-4 mb-2">Ready to grow?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Registration takes less than 5 minutes. Start receiving bookings instantly upon approval.
              </p>
              <Link href="/partner/register" className="block w-full">
                <button className="w-full py-4 rounded-xl bg-[#1B3A6B] hover:bg-[#142A4D] text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
                  Register as Vendor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <div className="mt-4 text-xs font-medium text-slate-400">
                Already a partner? <Link href="/partner/login" className="text-[#1B3A6B] font-bold hover:underline">Sign In</Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
