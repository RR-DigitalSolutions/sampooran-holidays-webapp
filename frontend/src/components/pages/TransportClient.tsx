"use client";

import { useState, useEffect } from "react";
import { Car, Search, ShieldCheck, MapPin, PhoneCall, Filter, LayoutGrid, List } from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/context/AuthContext";

export default function TransportClient() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    fetchTransport();
  }, []);

  const fetchTransport = async () => {
    try {
      const res = await fetch(`${API_BASE}/ota/transport`);
      const data = await res.json();
      setVehicles(data);

      try {
        const routesRes = await fetch(`${API_BASE}/ota/routes`);
        if (routesRes.ok) {
           const routesData = await routesRes.json();
           setRoutes(routesData);
        } else {
           // Fallback to static routes if API not present
           setRoutes([
             { id: 1, from: "Chandigarh", to: "Manali", distance: 310, estimatedTime: "8-9 hrs", startingPrice: 8000, isPopular: true },
             { id: 2, from: "Delhi", to: "Manali", distance: 540, estimatedTime: "14-15 hrs", startingPrice: 14000, isPopular: true },
             { id: 3, from: "Chandigarh", to: "Shimla", distance: 118, estimatedTime: "3-4 hrs", startingPrice: 3500, isPopular: true },
             { id: 4, from: "Manali", to: "Leh", distance: 480, estimatedTime: "14-16 hrs", startingPrice: 16000, isPopular: true }
           ]);
        }
      } catch (e) {
         console.warn("Routes fetch failed, using fallback");
      }
    } catch (e) {
      console.error("Transport sync error:", e);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Cab", "Tempo", "Coach", "Bike"];
  const filtered = type ? vehicles.filter(v => v.type === type) : vehicles;

  return (
    <div className="bg-background min-h-screen">
      {/* Dynamic Header */}
      <div className="bg-[#0A0A0B] text-white py-24 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/20 to-transparent pointer-events-none" />
         <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl space-y-6">
               <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full px-4 py-1 font-bold text-xs uppercase tracking-widest">Premium Transport Network</Badge>
               <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter leading-tight italic">
                 Explore the Himalayas with <span className="text-primary not-italic text-shadow-glow">Absolute Comfort.</span>
               </h1>
               <p className="text-white/50 text-xl font-medium max-w-xl">From adventure-ready 4x4s to luxury tempo travellers for your entire group.</p>
               
               <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
                     <ShieldCheck className="text-primary h-5 w-5" />
                     <span className="text-sm font-bold">Verified Professional Drivers</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
                     <Car className="text-primary h-5 w-5" />
                     <span className="text-sm font-bold">200+ Premium Fleet</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
         <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20 gap-8">
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <Button 
                    variant={!type ? "default" : "ghost"}
                    className={`rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-8 ${!type ? '' : 'text-muted-foreground'}`}
                    onClick={() => setType(null)}
                  >
                    All Fleet
                  </Button>
                  {categories.map(cat => (
                    <Button 
                      key={cat}
                      variant={type === cat ? "default" : "ghost"}
                      className={`rounded-2xl font-black uppercase tracking-widest text-[10px] h-11 px-8 ${type === cat ? '' : 'text-muted-foreground hover:bg-primary/5'}`}
                      onClick={() => setType(cat)}
                    >
                      {cat}s
                    </Button>
                  ))}
               </div>

               <div className="hidden md:flex flex-1 max-w-md relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search vehicle model or feature..." className="rounded-2xl pl-11 h-11 bg-muted/30 border-none font-medium placeholder:text-muted-foreground/50" />
               </div>

               <div className="flex items-center gap-2 border-l pl-8 border-black/5">
                  <Button variant="outline" size="icon" className="rounded-xl border-black/5"><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground"><List className="h-4 w-4" /></Button>
               </div>
            </div>
         </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-96 bg-muted rounded-3xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 bg-muted/10 rounded-[4rem] border border-dashed border-primary/10">
             <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-10 w-10 text-primary opacity-20" />
             </div>
             <h3 className="text-3xl font-serif font-bold mb-2 tracking-tight">No vehicles found in this category</h3>
             <p className="text-muted-foreground font-medium mb-8">We're expanding our fleet. Please check other categories or contact support.</p>
             <Button onClick={() => setType(null)} className="rounded-2xl font-black uppercase tracking-widest">Back to fleet</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        )}
      </div>

      {/* Popular Routes Section (Ported from Legacy) */}
      {routes.length > 0 && (
        <div className="container mx-auto px-4 py-16 bg-slate-50/50 rounded-[3rem] mb-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div className="space-y-2">
              <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-wider">Himalayan Circuits</Badge>
              <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tight italic">Popular Road <span className="text-primary not-italic">Routes.</span></h2>
            </div>
            <p className="text-muted-foreground font-medium max-w-sm">Fair pricing based on distance and terrain. No hidden charges.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routes.map(route => (
              <div key={route.id} className="bg-white border border-black/5 rounded-3xl p-6 flex items-center justify-between hover:shadow-xl transition-all group">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <MapPin className="h-5 w-5 text-primary group-hover:text-white" />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                         <p className="font-bold text-lg">{route.from} <span className="text-muted-foreground font-medium text-sm">to</span> {route.to}</p>
                         {route.isPopular && <span className="bg-accent text-accent-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Hot</span>}
                      </div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{route.distance} KM • {route.estimatedTime}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Starting From</p>
                   <p className="text-2xl font-black text-primary">₹{route.startingPrice?.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Section */}
      <div className="container mx-auto px-4 pb-24">
         <div className="bg-white border-2 border-primary/5 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-serif font-black tracking-tight leading-tight italic">Need a customized transport <br />plan for a group?</h3>
               <p className="text-muted-foreground font-medium max-w-md">Our transport experts are online 24/7 to provide you with the best rates for bulk group bookings and custom Himalayan circuits.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
               <Button className="h-16 px-10 rounded-2xl bg-black text-white hover:bg-primary font-black uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 transition-all">
                  <PhoneCall className="h-4 w-4" /> Call Transport Desk
               </Button>
               <Button variant="outline" className="h-16 px-10 rounded-2xl border-black/10 font-bold hover:bg-black/5 active:scale-95 transition-all">
                  WhatsApp Queries
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>;
}
