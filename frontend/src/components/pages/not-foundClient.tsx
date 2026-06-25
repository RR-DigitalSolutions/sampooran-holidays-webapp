"use client";

import Link from "next/link";
import { Compass, Home, Search, MapPin, ArrowRight } from "lucide-react";

export default function NotFound() {
  const popularDestinations = [
    { name: "Manali & Solang", slug: "manali" },
    { name: "Leh Ladakh", slug: "ladakh" },
    { name: "Kashmir Valley", slug: "kashmir" },
    { name: "Shimla Queen of Hills", slug: "shimla" }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#070E1C] text-white px-4 relative overflow-hidden">
      {/* Visual background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none" />

      <div className="max-w-2xl text-center space-y-8 z-10 my-16">
        {/* Floating Compass Illustration */}
        <div className="flex justify-center">
          <div className="relative animate-bounce duration-[4000ms]">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-md scale-105" />
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#1B3A6B] to-[#0D1B3E] border border-white/10 flex items-center justify-center shadow-2xl relative">
              <Compass className="w-16 h-16 md:w-20 md:h-20 text-[#D5A848] animate-[spin_10s_linear_infinite]" />
              <div className="absolute text-[10px] font-black text-white/40 top-2 font-mono">N</div>
              <div className="absolute text-[10px] font-black text-white/40 bottom-2 font-mono">S</div>
              <div className="absolute text-[10px] font-black text-white/40 left-2 font-mono">W</div>
              <div className="absolute text-[10px] font-black text-white/40 right-2 font-mono">E</div>
            </div>
          </div>
        </div>

        {/* Error Text */}
        <div className="space-y-3">
          <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#D5A848]">Error Code 404</span>
          <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight leading-none text-white">
            Oops! This page went on a holiday 🏔️
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto font-medium">
            The page you are looking for has wandered off our map. Let's get you back on track to planning your next dream vacation!
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#1B3A6B] to-[#2a519b] text-white hover:brightness-110 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Home className="w-4 h-4" /> Go Back Home
            </button>
          </Link>
          <Link href="/packages">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-[#D5A848] text-primary hover:brightness-110 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Search className="w-4 h-4" /> Explore Packages
            </button>
          </Link>
        </div>

        {/* Dynamic Helpers / Links */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500">Popular Destinations to Explore</p>
          <div className="flex flex-wrap justify-center gap-3">
            {popularDestinations.map((dest) => (
              <Link key={dest.slug} href={`/packages?destinationSlug=${dest.slug}`}>
                <div className="px-4 py-2 bg-white/5 border border-white/5 hover:border-accent/40 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer">
                  <MapPin className="w-3.5 h-3.5 text-[#D5A848]" />
                  <span>{dest.name}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
