"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Share2, Heart, ShieldCheck, Check, Info, Calendar,
  Users, Building2, Utensils, Wifi, Coffee, Phone, MessageSquare,
  Plus, Minus, X, ChevronRight, ChevronLeft, Bed, Sparkles, Clock, AlertTriangle,
  Plane, Bus, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoomConfig {
  adults: number;
  children: number;
}

export default function HotelDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "location" | "gallery" | "policies" | "reviews" | "faqs">("overview");
  const [galleryFilter, setGalleryFilter] = useState<"ALL" | "EXTERIOR" | "INTERIOR" | "ROOM" | "BATHROOM" | "DINING" | "POOL" | "OTHER">("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Room Gallery state
  const [roomGalleryOpen, setRoomGalleryOpen] = useState(false);
  const [selectedRoomImages, setSelectedRoomImages] = useState<string[]>([]);
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [roomActiveImageIndex, setRoomActiveImageIndex] = useState(0);

  // Dates state (default to tomorrow and day-after-tomorrow)
  const [checkIn, setCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  // Multi-room configurations state
  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>([{ adults: 2, children: 0 }]);
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchHotel();
  }, [slug]);

  // Click outside to close guest popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setGuestPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchHotel = async () => {
    try {
      // Fetching from /api/hotels/:slug which returns all associated rooms, photos, and reviews
      const res = await fetch(`${API_BASE}/hotels/${slug}`);
      if (!res.ok) throw new Error("Hotel not found");
      const data = await res.json();
      setHotel(data);
    } catch (e) {
      console.error("Hotel fetch error:", e);
      toast.error("Could not fetch hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-bold animate-pulse">Arriving at your destination...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Hotel Not Found</h2>
        <Button onClick={() => router.push("/hotels")} className="bg-[#1B3A6B] text-white">Back to Search</Button>
      </div>
    );
  }

  // Combine hotel photos & room images for the unified gallery
  const hotelPhotos = hotel.photos || [];
  const roomPhotos = (hotel.rooms || []).flatMap((r: any) =>
    (r.images || []).map((img: string) => ({
      url: img,
      category: "ROOM",
      caption: `${r.name} - Room view`
    }))
  );

  const getMappedCategory = (cat: string) => {
    const uppercaseCat = (cat || "").toUpperCase();
    if (["EXTERIOR", "INTERIOR", "ROOM", "BATHROOM", "DINING", "POOL"].includes(uppercaseCat)) {
      return uppercaseCat;
    }
    return "OTHER";
  };

  const allGalleryImages = [...hotelPhotos, ...roomPhotos].length > 0
    ? [...hotelPhotos, ...roomPhotos]
    : [
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200", category: "EXTERIOR", caption: "Hotel Exterior" },
      { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", category: "INTERIOR", caption: "Lobby" },
      { url: "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800", category: "ROOM", caption: "Bedroom" }
    ];

  const images = allGalleryImages.map(x => x.url);

  // Formatter for cancellation hours
  const formatCancellation = (hours: number) => {
    if (!hours) return "Free cancellation";
    if (hours % 168 === 0) {
      const weeks = hours / 168;
      return `Free cancellation up to ${weeks} week${weeks > 1 ? "s" : ""} before check-in`;
    }
    if (hours % 24 === 0) {
      const days = hours / 24;
      return `Free cancellation up to ${days} day${days > 1 ? "s" : ""} before check-in`;
    }
    return `Free cancellation up to ${hours} hour${hours > 1 ? "s" : ""} before check-in`;
  };

  // Calculate nights
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  // Dynamic Occupancy Surcharge Price Calculator for each Room Type
  const calculateRoomStayPrice = (room: any) => {
    let totalPrice = 0;
    const baseRoomPrice = room.basePrice;

    for (const config of roomsConfig) {
      let dailyPrice = baseRoomPrice;
      // Extra adults (covers above 2 adults)
      if (config.adults > 2) {
        dailyPrice += (config.adults - 2) * (room.extraAdultPrice || 0);
      }
      // Extra children
      if (config.children > 0) {
        dailyPrice += config.children * (room.extraChildPrice || 0);
      }
      totalPrice += dailyPrice * nights;
    }
    return totalPrice;
  };

  // Check if a room type can accommodate the selected rooms layout
  const isRoomValid = (room: any, config: RoomConfig) => {
    const maxAdults = room.maxAdults || room.maxOccupancy || 2;
    const maxChildren = room.maxChildren || 1;
    return config.adults <= maxAdults && config.children <= maxChildren;
  };

  const handleBookNow = (room: any) => {
    // Validate occupancy for all rooms in config
    const hasError = roomsConfig.some(config => !isRoomValid(room, config));
    if (hasError) {
      toast.error(`One or more rooms exceed the occupancy limits of the ${room.name}.`);
      return;
    }

    // Redirect to checkout with occupancy config in URL query string
    const roomsStr = encodeURIComponent(JSON.stringify(roomsConfig));
    router.push(`/hotels/${slug}/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${roomsStr}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900 font-sans">
      {/* 1. LUXURY HERO GALLERY */}
      <div className="container mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 h-[55vh] gap-3">
          <div onClick={() => { setActiveImageIndex(0); setGalleryOpen(true); }} className="md:col-span-2 relative overflow-hidden rounded-3xl group cursor-pointer shadow-md">
            <img src={images[0]} alt="Main cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <Badge className="bg-white/20 backdrop-blur-md border-none mb-2 hover:bg-white/30 text-white font-semibold capitalize">{hotel.type.toLowerCase()}</Badge>
              <h1 className="text-3xl md:text-4xl font-serif font-black uppercase tracking-tight leading-tight">{hotel.name}</h1>
              <p className="text-white/80 text-sm mt-1.5 flex items-center gap-1"><MapPin className="w-4 h-4 text-rose-400" /> {hotel.city}, {hotel.address}</p>
            </div>
          </div>
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div onClick={() => { setActiveImageIndex(1); setGalleryOpen(true); }} className="relative overflow-hidden rounded-3xl group cursor-pointer shadow-md">
              <img src={images[1] || images[0]} alt="Detail 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div onClick={() => { setActiveImageIndex(2); setGalleryOpen(true); }} className="relative overflow-hidden rounded-3xl group cursor-pointer shadow-md">
              <img src={images[2] || images[0]} alt="Detail 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <div onClick={() => setGalleryOpen(true)} className="hidden md:block relative rounded-3xl overflow-hidden group cursor-pointer shadow-md">
            <img src={images[3] || images[0]} alt="Detail 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0 brightness-75" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Button variant="outline" className="text-white border-white/40 hover:bg-white/10 font-bold rounded-2xl backdrop-blur-md">
                + View All {images.length} Photos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABS & DETAIL BODY CONTROLLER */}
      <div className="container mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white p-1 rounded-md border border-slate-100 shadow-xs flex gap-1 sticky top-[80px] lg:top-[76px] z-30 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview" },
              { id: "rooms", label: "Rooms & Rates" },
              { id: "location", label: "Location" },
              { id: "gallery", label: "Gallery" },
              { id: "policies", label: "Policies" },
              { id: "reviews", label: `Reviews (${hotel.reviews?.length || 0})` },
              { id: "faqs", label: "FAQs" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any);
                  const section = document.getElementById(t.id);
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className={cn(
                  "flex-1 p-2 rounded-sm text-sm font-bold transition-all text-center",
                  activeTab === t.id
                    ? "bg-[#1B3A6B] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Section: Overview */}
          <div id="overview" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < hotel.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                ))}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">{hotel.starRating} Star Luxury Hotel</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-full hover:bg-slate-50"><Share2 className="w-4 h-4 text-slate-600" /></Button>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-rose-50 hover:text-rose-500"><Heart className="w-4 h-4" /></Button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 mb-2">Property Description</h3>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {hotel.description || "Welcome to a sanctuary of absolute hospitality. Nestled in prime settings, our properties guarantee world-class utilities, seasoned staff availability, and dynamic dining configurations perfectly aligned with customer travel guides."}
            </p>

            {/* Key Amenities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                { icon: Wifi, label: "Free Wi-Fi", val: "High Speed" },
                { icon: Utensils, label: "Dining", val: "Kitchen Desk" },
                { icon: Coffee, label: "Breakfast", val: "Complimentary" },
                { icon: ShieldCheck, label: "Sanitized", val: "Safe Stay" }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex gap-3 items-center">
                  <div className="p-2.5 bg-sky-50 text-[#1B3A6B] rounded-xl"><item.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs font-black text-slate-700 mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Full Amenities Chips List */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Amenities Offered</p>
              <div className="flex flex-wrap gap-2">
                {(hotel.amenities || ["Wi-Fi", "Parking", "Room Service", "Laundry", "Complimentary Breakfast", "Hot Water", "Power Backup"]).map((amenity: string, i: number) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1.5 rounded-full text-slate-700 bg-slate-100 border-none hover:bg-slate-200">
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 stroke-[3]" /> {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Rooms & Rates */}
          <div id="rooms" className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bed className="w-5 h-5 text-[#1B3A6B]" /> Choose Your Room
              </h3>
              <span className="text-xs font-semibold text-slate-400">{hotel.rooms?.length || 0} room types available</span>
            </div>

            {/* Loop Room Types */}
            {hotel.rooms?.length > 0 ? (
              <div className="space-y-4">
                {hotel.rooms.map((room: any) => {
                  const stayTotal = calculateRoomStayPrice(room);
                  const isOccupancyExceeded = roomsConfig.some(config => !isRoomValid(room, config));

                  return (
                    <Card key={room.id} className={cn("overflow-hidden rounded-3xl border border-slate-200/60 shadow-xs transition-all hover:shadow-md bg-white", isOccupancyExceeded && "opacity-75")}>
                      <div className="flex flex-col md:flex-row">
                        {/* Room Image Carousel Placeholder */}
                        <div
                          onClick={() => {
                            if (room.images && room.images.length > 0) {
                              setSelectedRoomImages(room.images);
                              setSelectedRoomName(room.name);
                              setRoomActiveImageIndex(0);
                              setRoomGalleryOpen(true);
                            }
                          }}
                          className={cn(
                            "w-full md:w-72 h-48 md:h-auto relative bg-slate-100 shrink-0 select-none overflow-hidden",
                            room.images?.length > 0 && "cursor-pointer group"
                          )}
                        >
                          {room.images?.[0] ? (
                            <>
                              <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              {room.images.length > 1 && (
                                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[9px] font-bold">
                                  + {room.images.length} Photos
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                              <Building2 className="w-10 h-10 mb-1" />
                              <span className="text-[10px] uppercase font-bold">Photo coming soon</span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-[#1B3A6B] text-white border-none">{room.type}</Badge>
                          </div>
                        </div>

                        {/* Room Specifications & Details */}
                        <CardContent className="flex-1 p-5 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex justify-between items-start gap-4 flex-wrap">
                              <div>
                                <h4 className="text-lg font-bold text-slate-800">{room.name}</h4>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  Max adults: <span className="font-bold text-slate-700">{room.maxAdults || room.maxOccupancy || 2}</span>
                                  {room.maxChildren > 0 && (
                                    <> · Max children: <span className="font-bold text-slate-700">{room.maxChildren}</span></>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-medium text-[10px]">{room.bedType} Bed</Badge>
                                {room.sizeSqft && <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-medium text-[10px]">{room.sizeSqft} sq.ft</Badge>}
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 line-clamp-2">{room.description || "Spacious layout equipped with climate control tools and dynamic rest support configurations."}</p>

                            {/* Room Amenities */}
                            {room.amenities?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {room.amenities.slice(0, 5).map((a: string, idx: number) => (
                                  <span key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{a}</span>
                                ))}
                                {room.amenities.length > 5 && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">+{room.amenities.length - 5} more</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Cancellation rules & Booking CTA */}
                          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              {room.refundable ? (
                                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" /> {formatCancellation(room.cancellationHours)}
                                </p>
                              ) : (
                                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> Non-Refundable Stay
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Meal Plan: {room.mealPlan === "CP" ? "With Breakfast (CP)" : room.mealPlan === "MAP" ? "Breakfast & Dinner (MAP)" : room.mealPlan === "AP" ? "All Inclusive (AP)" : "Room Only (EP)"}</p>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                              <div className="text-right">
                                <div className="text-xs text-slate-400 font-medium">For {roomsConfig.length} room{roomsConfig.length > 1 ? "s" : ""} · {nights} night{nights > 1 ? "s" : ""}</div>
                                <div className="text-xl font-black text-[#1B3A6B] mt-0.5">₹{stayTotal.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-400 font-medium">Excludes 12% GST</div>
                              </div>

                              {isOccupancyExceeded ? (
                                <div className="group relative">
                                  <Button disabled className="bg-slate-200 text-slate-400 font-bold rounded-xl h-11 px-5 border-none">
                                    Occupancy Exceeded
                                  </Button>
                                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold p-2.5 rounded-lg shadow-sm w-48 text-center z-10">
                                    Your occupancy details exceed the maximum guests limit for this room type.
                                  </div>
                                </div>
                              ) : (
                                <Button onClick={() => handleBookNow(room)} className="bg-[#1B3A6B] text-white hover:bg-[#0f2548] font-bold rounded-xl h-11 px-5 flex items-center gap-1">
                                  Select Room <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                <Bed className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-500">No rooms types configured.</p>
                <p className="text-xs text-slate-400 mt-1">Please contact the admin desk or check back later.</p>
              </div>
            )}
          </div>

          {/* Section: Location (Proximity Points) */}
          <div id="location" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" /> Location & Surroundings
                </h3>
                <p className="text-xs text-slate-500 mt-1">{hotel.address || `${hotel.city || ""}, ${hotel.state || ""}`}</p>
              </div>
              {hotel.starRating && (
                <div className="text-right">
                  <span className="text-sm font-black text-sky-600">Very Good {hotel.starRating + 4.9}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Location rating</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Airports */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-500" /> Airports
                </h4>
                <div className="space-y-3">
                  {(hotel.proximity || []).filter((p: any) => p.category === "Airports").length > 0 ? (
                    (hotel.proximity || []).filter((p: any) => p.category === "Airports").map((point: any, i: number) => (
                      <div key={i} className="flex items-start justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{point.name}</span>
                        <span className="text-slate-400 shrink-0 font-bold ml-2">{point.distance}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No airport distance data provided.</p>
                  )}
                </div>
              </div>

              {/* Public Transportation */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-emerald-500" /> Public Transportation
                </h4>
                <div className="space-y-3">
                  {(hotel.proximity || []).filter((p: any) => p.category === "Public transportation").length > 0 ? (
                    (hotel.proximity || []).filter((p: any) => p.category === "Public transportation").map((point: any, i: number) => (
                      <div key={i} className="flex items-start justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{point.name}</span>
                        <span className="text-slate-400 shrink-0 font-bold ml-2">{point.distance}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No transit distance data provided.</p>
                  )}
                </div>
              </div>

              {/* Hospital or Clinic */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" /> Hospital or Clinic
                </h4>
                <div className="space-y-3">
                  {(hotel.proximity || []).filter((p: any) => p.category === "Hospital or clinic").length > 0 ? (
                    (hotel.proximity || []).filter((p: any) => p.category === "Hospital or clinic").map((point: any, i: number) => (
                      <div key={i} className="flex items-start justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{point.name}</span>
                        <span className="text-slate-400 shrink-0 font-bold ml-2">{point.distance}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No medical distance data provided.</p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-50">
              Distances shown are straight-line distances on the map. Actual travel distances may vary.
            </p>
          </div>

          {/* Section: Hotel Gallery */}
          <div id="gallery" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" /> Property Gallery & Rooms
                </h3>
                <p className="text-xs text-slate-500 mt-1">Explore all photos of rooms, interiors, exteriors, and dining points.</p>
              </div>
              <span className="bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#1B3A6B]/15">
                {allGalleryImages.length} Photos total
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "ALL", label: "All Photos" },
                { key: "EXTERIOR", label: "Exterior" },
                { key: "INTERIOR", label: "Interior" },
                { key: "ROOM", label: "Room" },
                { key: "BATHROOM", label: "Bathroom" },
                { key: "DINING", label: "Dining" },
                { key: "POOL", label: "Pool" },
                { key: "OTHER", label: "Other" }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setGalleryFilter(f.key as any)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                    galleryFilter === f.key
                      ? "bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grid of photos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {allGalleryImages
                .map((img: any, idx: number) => ({ ...img, originalIdx: idx }))
                .filter((img: any) => {
                  if (galleryFilter === "ALL") return true;
                  return getMappedCategory(img.category) === galleryFilter;
                })
                .map((img: any) => (
                  <div
                    key={img.originalIdx}
                    onClick={() => {
                      setActiveImageIndex(img.originalIdx);
                      setGalleryOpen(true);
                    }}
                    className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/50 cursor-pointer shadow-xs"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || "Property Photo"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                      <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg truncate max-w-full">
                        {img.caption || img.category || "View Photo"}
                      </span>
                    </div>
                    {img.category && (
                      <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {img.category}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Section: Policies */}
          <div id="policies" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Property Policies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-xl mt-0.5"><Clock className="w-4 h-4" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">Check-in / Check-out Times</h5>
                    <p className="text-xs text-slate-500 mt-1">Check-in from: <span className="font-bold text-slate-700">{hotel.checkInTime || "12:00 PM"}</span></p>
                    <p className="text-xs text-slate-500">Check-out before: <span className="font-bold text-slate-700">{hotel.checkOutTime || "11:00 AM"}</span></p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-xl mt-0.5"><Users className="w-4 h-4" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">Children & Extra Beds</h5>
                    <p className="text-xs text-slate-500 mt-1">Children of all ages are welcome. Double check child extra rates under room configuration guidelines.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-xl mt-0.5"><Info className="w-4 h-4" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">Custom House Rules</h5>
                    <p className="text-xs text-slate-500 mt-1">Guests must present a valid government-issued photo ID at check-in. Local resident restrictions may apply.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-xl mt-0.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">Booking Guarantee</h5>
                    <p className="text-xs text-slate-500 mt-1">Managed directly by Sampooran Holidays with secure instant confirmation routing protocols.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Hotel Policies Tab content from db */}
            {hotel.policies && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 space-y-3">
                <h5 className="font-black text-xs uppercase tracking-widest text-[#1B3A6B]">Detailed Rules & Disclaimers</h5>
                <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  {hotel.policies.checkInPolicy && <p><strong>Check-In Policy:</strong> {hotel.policies.checkInPolicy}</p>}
                  {hotel.policies.cancellationPolicy && <p><strong>Cancellation Policy:</strong> {hotel.policies.cancellationPolicy}</p>}
                  {hotel.policies.childPolicy && <p><strong>Child Policy:</strong> {hotel.policies.childPolicy}</p>}
                  {hotel.policies.otherRules && <p><strong>Other Info:</strong> {hotel.policies.otherRules}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Section: Reviews */}
          <div id="reviews" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-600" /> Guest Reviews
            </h3>

            {/* Summary Ratings Aggregates */}
            {hotel.ratingsSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center md:border-r border-slate-100 py-3">
                  <div className="text-5xl font-black text-[#1B3A6B] font-serif">{hotel.ratingsSummary.avg_rating || hotel.starRating}</div>
                  <div className="text-xs text-slate-400 mt-1.5 uppercase font-bold tracking-wider">Average Rating</div>
                  <div className="text-[10px] text-slate-400 mt-1">{hotel.ratingsSummary.total || 0} reviews evaluated</div>
                </div>
                <div className="col-span-2 space-y-2 text-xs">
                  {[
                    { label: "Cleanliness", val: hotel.ratingsSummary.avg_cleanliness },
                    { label: "Comfort", val: hotel.ratingsSummary.avg_comfort },
                    { label: "Location", val: hotel.ratingsSummary.avg_location },
                    { label: "Service", val: hotel.ratingsSummary.avg_service }
                  ].map((agg, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-20 text-slate-500 font-medium text-left">{agg.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1B3A6B] rounded-full" style={{ width: `${(Number(agg.val || 4) / 5) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-black text-slate-700">{agg.val || "4.0"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No score summaries compiled yet.</p>
            )}

            {/* Reviews List */}
            {hotel.reviews?.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {hotel.reviews.map((r: any) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100/60 space-y-2">
                    <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{r.guestName || "Valued Guest"}</span>
                        <span className="text-slate-400 ml-2 font-medium">· Verified Stay</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {r.rating}
                      </div>
                    </div>
                    {r.title && <h5 className="font-bold text-sm text-slate-800">{r.title}</h5>}
                    <p className="text-[8px] text-slate leading-relaxed">{r.body}</p>
                    {r.stayDate && <p className="text-[10px] text-slate-400 font-medium">Stayed on {new Date(r.stayDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border-t border-slate-100">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No reviews published yet for this property.</p>
              </div>
            )}
          </div>

          {/* Section: FAQs Accordion */}
          <div id="faqs" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1B3A6B]" /> Frequently Asked Questions
            </h3>

            {hotel.faqs && hotel.faqs.length > 0 ? (
              <div className="space-y-3">
                {hotel.faqs.map((faq: any, idx: number) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 bg-slate-50/50 hover:bg-slate-50">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800 focus:outline-none"
                      >
                        <span>{faq.question}</span>
                        <Plus className={cn("w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ml-4", isOpen && "rotate-45 text-[#1B3A6B]")} />
                      </button>
                      <div className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isOpen ? "grid-rows-[1fr] opacity-100 border-t border-slate-100/50" : "grid-rows-[0fr] opacity-0"
                      )}>
                        <div className="overflow-hidden">
                          <p className="p-4 text-xs leading-relaxed text-slate-600 bg-white">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
                <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No FAQs provided for this property yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. STICKY BOOKING WIDGET */}
        <div className="w-full lg:w-[400px] space-y-4">
          {/* Visual Map Embed Section */}
          <Card className="lg:sticky lg:top-[80px] lg:z-20 shadow-sm border border-slate-100 rounded-xl overflow-hidden bg-white p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1B3A6B]" /> Property Location Map
            </h4>
            <div className="relative w-full h-[180px] bg-slate-50 rounded-xl overflow-hidden group border border-slate-100">
              <iframe
                title="Hotel Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${hotel.latitude && hotel.longitude ? `${hotel.latitude},${hotel.longitude}` : encodeURIComponent(`${hotel.name}, ${hotel.city || ""}`)}&z=15&output=embed`}
                className="rounded-xl filter contrast-105"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{hotel.address || `${hotel.city || ""}, ${hotel.state || ""}`}</span>
            </div>
          </Card>

          <Card className="lg:sticky lg:top-[376px] lg:z-10 shadow-xl border-none rounded-xl overflow-hidden bg-[#0F1E3D] text-white p-7 space-y-6">
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-1.5">Starting at</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">₹{(hotel.minPrice || hotel.startingPrice || 3500).toLocaleString()}</span>
                <span className="text-xs text-white/40 font-bold italic">/night</span>
              </div>
            </div>

            {/* Date selectors */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Check-in</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-sky-400 absolute left-3.5 top-4 pointer-events-none" />
                    <input
                      type="date"
                      aria-label="Check-in"
                      value={checkIn}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (new Date(e.target.value) >= new Date(checkOut)) {
                          const d = new Date(e.target.value);
                          d.setDate(d.getDate() + 1);
                          setCheckOut(d.toISOString().split("T")[0]);
                        }
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white pl-10 pr-2 text-xs font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Check-out</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-sky-400 absolute left-3.5 top-4 pointer-events-none" />
                    <input
                      type="date"
                      aria-label="Check-out"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn}
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white pl-10 pr-2 text-xs font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Guest & Room Configuration Popover Trigger */}
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Guests & Rooms</label>
                <button
                  onClick={() => setGuestPopoverOpen(!guestPopoverOpen)}
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 text-left text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    {roomsConfig.length} Room{roomsConfig.length > 1 ? "s" : ""} · {roomsConfig.reduce((acc, c) => acc + c.adults, 0)} Adult{roomsConfig.reduce((acc, c) => acc + c.adults, 0) > 1 ? "s" : ""}
                    {roomsConfig.reduce((acc, c) => acc + c.children, 0) > 0 && ` · ${roomsConfig.reduce((acc, c) => acc + c.children, 0)} Child`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Dropdown Guest Config Popover */}
                {guestPopoverOpen && (
                  <div ref={popoverRef} className="absolute z-30 left-0 right-0 top-full mt-2 bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-xs text-[#1B3A6B] uppercase tracking-wider">Occupancy Setup</h4>
                      <button onClick={() => setGuestPopoverOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                      {roomsConfig.map((config, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span>Room {index + 1}</span>
                            {roomsConfig.length > 1 && (
                              <button
                                onClick={() => setRoomsConfig(prev => prev.filter((_, idx) => idx !== index))}
                                className="text-rose-500 text-[10px] hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                              <span className="text-[11px] font-semibold text-slate-500">Adults</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, adults: Math.max(1, c.adults - 1) } : c));
                                  }}
                                  className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{config.adults}</span>
                                <button
                                  onClick={() => {
                                    setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, adults: Math.min(4, c.adults + 1) } : c));
                                  }}
                                  className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                              <span className="text-[11px] font-semibold text-slate-500">Kids</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, children: Math.max(0, c.children - 1) } : c));
                                  }}
                                  className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{config.children}</span>
                                <button
                                  onClick={() => {
                                    setRoomsConfig(prev => prev.map((c, i) => i === index ? { ...c, children: Math.min(3, c.children + 1) } : c));
                                  }}
                                  className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center font-bold text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {roomsConfig.length < 5 && (
                      <Button
                        onClick={() => setRoomsConfig(prev => [...prev, { adults: 2, children: 0 }])}
                        variant="outline"
                        className="w-full text-xs font-bold rounded-xl border-slate-200 text-[#1B3A6B] hover:bg-slate-50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Room
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick check details */}
            <div className="pt-2 border-t border-white/10 space-y-3 text-xs text-white/70">
              <div className="flex justify-between">
                <span>Check-in date</span>
                <span className="font-bold text-white">{new Date(checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out date</span>
                <span className="font-bold text-white">{new Date(checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Stay duration</span>
                <span className="font-bold text-white">{nights} Night{nights > 1 ? "s" : ""}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                const el = document.getElementById("rooms");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                toast.info("Please select a specific room type from the list below to book your stay.");
              }}
              className="w-full h-14 rounded-2xl bg-white text-[#0F1E3D] hover:bg-white/90 font-black uppercase tracking-wider text-xs shadow-lg transition-transform active:scale-98"
            >
              Select Rooms & Book
            </Button>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <a href="tel:+918595513009" className="flex-1 h-11 rounded-xl border border-white/10 font-bold text-xs text-white hover:bg-white/5 flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" /> Call Desk
              </a>
              <button onClick={() => toast.success("Opening chat inquiry support desk...")} className="flex-1 h-11 rounded-xl border border-white/10 font-bold text-xs text-white hover:bg-white/5 flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Inquiry
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. GALLERY FULLSCREEN MODAL */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-8">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-bold tracking-widest uppercase">Photo Gallery ({activeImageIndex + 1}/{images.length})</span>
            <button onClick={() => setGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="relative flex-1 flex items-center justify-center max-h-[80vh]">
            <button
              onClick={() => setActiveImageIndex(prev => (prev - 1 + images.length) % images.length)}
              className="absolute left-0 md:left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img src={images[activeImageIndex]} alt="Gallery slide" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-fade-in" />

            <button
              onClick={() => setActiveImageIndex(prev => (prev + 1) % images.length)}
              className="absolute right-0 md:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnail list */}
          <div className="flex gap-2.5 overflow-x-auto justify-center pb-2 pt-4 px-2 max-w-2xl mx-auto scrollbar-thin">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={cn("w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all opacity-60 hover:opacity-100", activeImageIndex === idx ? "border-sky-400 scale-105 opacity-100" : "border-transparent")}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. ROOM GALLERY FULLSCREEN MODAL */}
      {roomGalleryOpen && selectedRoomImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-8">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-bold tracking-widest uppercase">{selectedRoomName} Gallery ({roomActiveImageIndex + 1}/{selectedRoomImages.length})</span>
            <button onClick={() => setRoomGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="relative flex-1 flex items-center justify-center max-h-[80vh]">
            <button
              onClick={() => setRoomActiveImageIndex(prev => (prev - 1 + selectedRoomImages.length) % selectedRoomImages.length)}
              className="absolute left-0 md:left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img src={selectedRoomImages[roomActiveImageIndex]} alt="Room gallery slide" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-fade-in" />

            <button
              onClick={() => setRoomActiveImageIndex(prev => (prev + 1) % selectedRoomImages.length)}
              className="absolute right-0 md:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnail list */}
          <div className="flex gap-2.5 overflow-x-auto justify-center pb-2 pt-4 px-2 max-w-2xl mx-auto scrollbar-thin">
            {selectedRoomImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setRoomActiveImageIndex(idx)}
                className={cn("w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all opacity-60 hover:opacity-100", roomActiveImageIndex === idx ? "border-sky-400 scale-105 opacity-100" : "border-transparent")}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
