"use client";


import { useListDestinations, useListCountries, useListStates } from "@workspace/api-client-react";
import {  } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FALLBACK_DESTINATIONS = [
  { id: 1, name: "Manali", slug: "manali", stateName: "Himachal Pradesh", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600", description: "The adventure capital of India — snow peaks, river rapids, and vibrant culture.", packageCount: 24, bestTimeToVisit: "Oct-Feb (snow), May-Jun (Rohtang)", isFeatured: true },
  { id: 2, name: "Leh Ladakh", slug: "leh-ladakh", stateName: "Ladakh", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1585136917228-84d90aa03a77?w=600", description: "Land of high passes, azure lakes, and ancient monasteries at 11,000 ft.", packageCount: 18, bestTimeToVisit: "Jun-Sep", isFeatured: true },
  { id: 3, name: "Shimla", slug: "shimla", stateName: "Himachal Pradesh", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600", description: "Queen of Hills — colonial charm, Mall Road, and Kufri snow slopes.", packageCount: 16, bestTimeToVisit: "Year-round", isFeatured: true },
  { id: 4, name: "Spiti Valley", slug: "spiti-valley", stateName: "Himachal Pradesh", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=600", description: "The cold desert — monastery-dotted landscapes at extreme altitudes.", packageCount: 12, bestTimeToVisit: "Jun-Oct", isFeatured: true },
  { id: 5, name: "Srinagar", slug: "srinagar", stateName: "Kashmir", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600", description: "Floating gardens, Dal Lake houseboats, and Mughal gardens of paradise.", packageCount: 20, bestTimeToVisit: "Apr-Jun, Sep-Oct", isFeatured: true },
  { id: 6, name: "Rishikesh", slug: "rishikesh", stateName: "Uttarakhand", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600", description: "Yoga capital of the world — Ganga rafting, adventure sports, and spirituality.", packageCount: 14, bestTimeToVisit: "Feb-Jun, Sep-Nov", isFeatured: false },
  { id: 7, name: "Jaipur", slug: "jaipur", stateName: "Rajasthan", countryName: "India", imageUrl: "https://images.unsplash.com/photo-1477587458883-47145ed31bba?w=600", description: "The Pink City — majestic forts, royal palaces, and vibrant bazaars.", packageCount: 15, bestTimeToVisit: "Oct-Mar", isFeatured: false },
  { id: 8, name: "Bangkok", slug: "bangkok", stateName: "Bangkok", countryName: "Thailand", imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600", description: "City of temples and street food — vibrant nightlife meets ancient culture.", packageCount: 10, bestTimeToVisit: "Nov-Feb", isFeatured: false },
];

export default function Destinations() {
  const { data: destData } = useListDestinations();
  const { data: countriesData } = useListCountries();
  const [activeCountry, setActiveCountry] = useState("all");

  const destinations = destData?.destinations?.length ? destData.destinations : FALLBACK_DESTINATIONS;

  const allCountries = ["all", ...new Set(destinations.map(d => d.countryName ?? "India").filter(Boolean))];
  const filtered = activeCountry === "all" ? destinations : destinations.filter(d => d.countryName === activeCountry);

  return (
    <>
      

      {/* Header */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-black mb-4">
            Explore Destinations <span className="block text-accent">Tour Packages</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Discover the most compelling destination packages in India and beyond. Each listing is curated for travellers who want immersive experiences, luxury stays, and seamless booking support.</p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white/10 border border-white/10 p-5 text-center">
              <p className="text-3xl font-bold">20+</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mt-2">Destinations</p>
            </div>
            <div className="rounded-3xl bg-white/10 border border-white/10 p-5 text-center">
              <p className="text-3xl font-bold">150+</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mt-2">Tour packages</p>
            </div>
            <div className="rounded-3xl bg-white/10 border border-white/10 p-5 text-center">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mt-2">Travel support</p>
            </div>
            <div className="rounded-3xl bg-white/10 border border-white/10 p-5 text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mt-2">Tailored itineraries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Filter */}
      <div className="sticky top-16 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {allCountries.map(c => (
              <button
                key={c}
                onClick={() => setActiveCountry(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCountry === c ? "bg-primary text-white" : "bg-secondary text-foreground hover:bg-primary/10"}`}
              >
                {c === "all" ? "All Destinations" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(dest => (
            <Link key={dest.id} href={`/destinations/${dest.slug}`}>
              <div className="group rounded-[2rem] overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl cursor-pointer">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={dest.imageUrl ?? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {dest.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-accent text-accent-foreground text-xs">Featured</Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-serif font-bold text-xl">{dest.name}</h3>
                    <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />{dest.stateName}, {dest.countryName}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{dest.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Package className="h-3 w-3" />{dest.packageCount} Packages
                    </span>
                    <span className="text-accent text-xs font-semibold group-hover:underline">Explore &rarr;</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
