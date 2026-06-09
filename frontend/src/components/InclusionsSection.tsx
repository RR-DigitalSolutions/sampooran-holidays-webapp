"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  Utensils,
  Car,
  Users,
  ShieldCheck,
  Headphones,
  Award,
  Globe,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Award,
    title: "12+ Years Experience",
    desc: "Himalayan experts crafting perfect journeys since 2012.",
  },
  {
    icon: Hotel,
    title: "Accommodation",
    desc: "Comfortable & convenient hotels cherry picked by our team.",
  },
  {
    icon: Utensils,
    title: "All meals",
    desc: "Eat to your heart's content — Breakfast, Lunch, Dinner included.",
  },
  {
    icon: Car,
    title: "On-tour transport",
    desc: "All rail, sea and road transport included for a tension-free trip.",
  },
  {
    icon: Users,
    title: "Expert Tour Managers",
    desc: "Exclusive team of managers specialising in Himalayan and India tours.",
  },
  {
    icon: Headphones,
    title: "24/7 Ground Support",
    desc: "Round-the-clock assistance to ensure a seamless travel experience.",
  },
  {
    icon: ShieldCheck,
    title: "100% Secure & Trusted",
    desc: "Your safety and satisfaction are our top priority.",
  },
  {
    icon: Globe,
    title: "B2B Agent Network",
    desc: "Trusted by over 500+ travel agent partners across India.",
  }
];

export function InclusionsSection() {
  const [isReadMore, setIsReadMore] = useState(false);

  return (
    <section className="pt-2 pb-10 md:py-10 bg-white">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="text-center mb-8">
          <p className="text-accent font-bold text-sm mb-2 uppercase tracking-widest">Why Choose Sampooran Holidays</p>
          <h2 className="text-xl md:text-3xl font-serif font-semibold text-primary mb-4 relative inline-block">
            Your Complete Travel Partner - All Inclusive Tours!
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-accent/20 rounded-full" />
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-accent rounded-full" />
          </h2>
        </div>

        {/* Merged Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6">
          {FEATURES.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col items-center text-center p-2 rounded-3xl border border-slate-50 hover:border-accent/20 hover:bg-slate-50/50 transition-all duration-500 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-[#1e3a8a] rounded-xl flex items-center justify-center mb-2 relative overflow-hidden transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-500 shadow-lg shadow-primary/20 shrink-0">
                {/* Animation Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
              </div>
              <h3 className="text-[11px] md:text-sm font-semibold text-primary tracking-tight leading-tight mb-1">
                {item.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-[9px] md:text-xs font-medium line-clamp-3">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* SEO Text Section */}
        <div className="max-w-6xl mx-auto border-t border-slate-100 pt-8">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Find the best travel packages at Sampooran Holidays
          </h3>
          <div className={cn(
            "space-y-4 text-slate-600 leading-relaxed text-[11px] font-medium transition-all duration-700 overflow-hidden relative",
            !isReadMore && "max-h-[80px]"
          )}>
            <p>
              Sampooran Holidays is a premier travel agency in India, specializing in curated travel packages that offer more than just a destination. We provide holistic holiday experiences with end-to-end planning, ensuring every journey is memorable. Counted among the best travel agents, we offer a wide assortment of tour packages tailored to your specific needs.
            </p>
            <p>
              In our constant endeavour to be the best travel company, everything we do is based on creating and setting new benchmarks. With extensive travel know-how and a wide assortment of travel packages, we ensure the best holiday experiences for every traveler.
            </p>

            {!isReadMore && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          <button
            onClick={() => setIsReadMore(!isReadMore)}
            className="mt-6 flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest hover:text-accent transition-colors"
          >
            {isReadMore ? "Read Less" : "Read More"}
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isReadMore && "rotate-180")} />
          </button>
        </div>
      </div>
    </section>
  );
}
