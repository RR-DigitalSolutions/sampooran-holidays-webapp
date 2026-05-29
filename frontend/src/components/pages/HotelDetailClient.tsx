"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Share2, Heart, ShieldCheck, Check, Info, Calendar, Users, Building2, Utensils, Wifi, Coffee, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE } from "@/context/AuthContext";
import { toast } from "sonner";

export default function HotelDetailClient({ slug }: { slug: string }) {
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotel();
  }, [slug]);

  const fetchHotel = async () => {
    try {
      const res = await fetch(`${API_BASE}/ota/hotels/${slug}`); 
      const data = await res.json();
      setHotel(data);
    } catch (e) {
      console.error("Hotel fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse font-serif text-2xl">Arriving at your destination...</div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl">Hotel not found.</div>;

  const images = hotel.images?.length > 0 ? hotel.images : [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800"
  ];

  return (
    <div className="bg-white pb-24">
      {/* 1. HERO GALLERY */}
      <div className="grid grid-cols-1 md:grid-cols-4 h-[60vh] gap-2 p-2">
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl group">
          <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <Badge className="bg-white/20 backdrop-blur-md border-none mb-2">{hotel.type}</Badge>
            <h1 className="text-4xl font-serif font-black tracking-tight leading-none uppercase">{hotel.name}</h1>
          </div>
        </div>
        <div className="hidden md:grid grid-rows-2 gap-2 h-full">
           <img src={images[1]} className="w-full h-full object-cover rounded-2xl" />
           <img src={images[2]} className="w-full h-full object-cover rounded-2xl" />
        </div>
        <div className="hidden md:block relative rounded-2xl overflow-hidden group">
           <img src={images[0]} className="w-full h-full object-cover grayscale opacity-50" />
           <div className="absolute inset-0 flex items-center justify-center bg-black/40">
             <Button variant="outline" className="text-white border-white/40 hover:bg-white/10 font-bold rounded-2xl backdrop-blur-md">
                + See All Photos
             </Button>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-12">
        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 space-y-12">
           <div className="flex items-start justify-between">
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= hotel.starRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-2">{hotel.starRating} Star Luxury Stay</span>
                 </div>
                 <div className="flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg font-medium">{hotel.address}</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                 <Button variant="outline" size="icon" className="rounded-full"><Heart className="w-4 h-4" /></Button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100">
              {[
                { icon: Wifi, val: "High-Speed", label: "Internet" },
                { icon: Utensils, val: "Multi-Cuisine", label: "Dining" },
                { icon: ShieldCheck, val: "Sanitized", label: "Safety" },
                { icon: Coffee, val: "Mountain View", label: "Cafe" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="p-3 bg-primary/5 rounded-2xl text-primary"><item.icon className="h-5 w-5" /></div>
                   <div>
                      <p className="text-sm font-black leading-none">{item.val}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">{item.label}</p>
                   </div>
                </div>
              ))}
           </div>

           <div className="space-y-6">
              <h3 className="text-2xl font-serif font-black tracking-tight">Property Overview</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {hotel.description || "A sanctuary of luxury nestled in the heart of the Himalayas. Experience unparalleled comfort with world-class amenities and breathtaking views. This property is handpicked for travelers seeking both peace and sophistication."}
              </p>
           </div>

           <div className="space-y-6">
              <h3 className="text-2xl font-serif font-black tracking-tight">Available Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                 {(hotel.amenities || ["Free Wi-Fi", "Daily Breakfast", "Parking", "Room Service", "Laundry", "Lounge", "Bonfire"]).map((ame: string, i: number) => (
                   <div key={i} className="flex items-center gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{ame}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 3. SIDEBAR: BOOKING / INQUIRY WIDGET */}
        <div className="w-full lg:w-[400px]">
           <Card className="sticky top-24 shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-[#0A0A0B] text-white p-8 space-y-8">
              <div>
                 <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-2">Starting at</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-black tracking-tighter italic">₹{(hotel.startingPrice || 3500).toLocaleString()}</span>
                    <span className="text-sm text-white/40 font-bold italic">/night</span>
                 </div>
                 <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Best Rate Guaranteed</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Check-in</label>
                       <Button variant="outline" className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold justify-start gap-3 hover:bg-white/10">
                          <Calendar className="w-4 h-4 text-primary" /> Select
                       </Button>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Guests</label>
                       <Button variant="outline" className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold justify-start gap-3 hover:bg-white/10">
                          <Users className="w-4 h-4 text-primary" /> 2 Adults
                       </Button>
                    </div>
                 </div>
                 
                 <Button className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    Book This Property
                 </Button>
                 
                 <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl border border-white/10 font-bold gap-2 text-white hover:bg-white/5">
                       <MessageSquare className="w-4 h-4" /> Inquiry
                    </Button>
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl border border-white/10 font-bold gap-2 text-white hover:bg-white/5">
                       <Phone className="w-4 h-4" /> Call Desk
                    </Button>
                 </div>
              </div>

              <div className="pt-4 space-y-4">
                 <p className="text-[10px] font-bold text-white/30 uppercase text-center tracking-widest italic">Booking managed by Sampooran Travel Experts</p>
                 <div className="flex items-center gap-4 p-4 rounded-3xl bg-linear-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                    <ShieldCheck className="h-8 w-8 text-emerald-500 shrink-0" />
                    <div>
                       <p className="text-xs font-black uppercase leading-none mb-1 text-emerald-500 italic">Enterprise Protected</p>
                       <p className="text-[10px] text-white/60 font-medium">Verified Vendor & Secure Payment</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
