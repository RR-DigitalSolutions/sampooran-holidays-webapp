"use client";

import { useState } from "react";
import { X, MapPin, Clock, DollarSign, Award, Lightbulb, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn, validateImageUrl } from "@/lib/utils";

type AttractionActivityModalProps = {
  type: "attraction" | "activity" | "hotel" | "transport" | "dining";
  data: any;
  isOpen: boolean;
  onClose: () => void;
};

export function AttractionActivityModal({
  type,
  data,
  isOpen,
  onClose,
}: AttractionActivityModalProps) {
  if (!isOpen || !data) return null;

  const rawImages = data.images && Array.isArray(data.images) ? data.images : [];
  const cover = data.coverImage || data.image || data.imageUrl || (rawImages.length > 0 ? rawImages[0] : null);
  const allImages = cover
    ? [cover, ...rawImages.filter((img: string) => img !== cover)].filter(Boolean)
    : rawImages;

  const highlights = Array.isArray(data.highlights) ? data.highlights : [];
  const tips = Array.isArray(data.tips) ? data.tips : [];
  const famousFor = Array.isArray(data.famousFor) ? data.famousFor : [];

  const formatAmenityName = (feat: any): string => {
    if (!feat) return "";
    if (typeof feat === "object") {
      const val = feat.label || feat.name || feat.key || JSON.stringify(feat);
      return formatAmenityName(val);
    }
    const str = String(feat).trim();
    if (str.startsWith("[object") || str === "object") {
      return "";
    }
    const overrides: Record<string, string> = {
      WIFI: "Free Wi-Fi",
      AC: "Air Conditioning",
      POOL: "Swimming Pool",
      GYM: "Fitness Center",
      SPA: "Spa & Massage",
      TV: "Flat-screen TV",
      ROOM_SERVICE: "Room Service",
      PARKING: "Free Parking",
      HEATING: "Room Heating",
      HOT_WATER: "24/7 Hot Water",
      BONFIRE: "Bonfire",
      MOUNTAIN_VIEW: "Mountain View",
      VALLEY_VIEW: "Valley View",
      BREAKFAST: "Breakfast Included"
    };
    const key = str.toUpperCase();
    if (overrides[key]) return overrides[key];
    return str
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] overflow-y-auto flex items-start justify-center pt-4 pb-8 px-4 sm:pt-8">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden border border-slate-100 animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Hero Banner */}
          <div className="relative h-[200px] sm:h-[280px] bg-slate-900 overflow-hidden">
            {cover ? (
              <img
                src={validateImageUrl(cover, 1200, 600, "16:9")}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/40" />
              </div>
            )}
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

            {/* Floating Top Header (Close button only) */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-black/40 hover:bg-black/60 active:scale-95 text-white rounded-full backdrop-blur-md transition shadow-md cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Badges Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white uppercase tracking-wider shadow-sm">
                  {type === "attraction" ? "Attraction" : type === "activity" ? "Activity" : type === "hotel" ? "Hotel stay" : type === "dining" ? "Enroute Dining" : "Transport service"}
                </span>
                {data.type && (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white uppercase tracking-wider border border-white/10">
                    {data.type}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                {data.name}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-360px)]">
            {/* Gallery strip (only if we have >1 image) */}
            {allImages.length > 1 && (
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Gallery Photos
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {allImages.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60"
                    >
                      <img
                        src={validateImageUrl(img, 200, 200, "1:1")}
                        alt={`${data.name} ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(data.shortDescription || data.description) && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {data.shortDescription || data.description}
                </p>
              </div>
            )}

            {/* Long Description */}
            {data.longDescription && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-500 uppercase mb-3">
                  About
                </p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.longDescription}
                </p>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-semibold text-slate-900">Highlights</p>
                </div>
                <ul className="space-y-2">
                  {highlights.map((highlight: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-slate-900">Tips</p>
                </div>
                <ul className="space-y-2">
                  {tips.map((tip: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practical Info */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-500 uppercase mb-4">
                Practical Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.timingInfo && (
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Timing</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.timingInfo}
                      </p>
                    </div>
                  </div>
                )}
                {data.entryFee && (
                  <div className="flex gap-3">
                    <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Entry Fee</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.entryFee}
                      </p>
                    </div>
                  </div>
                )}
                {data.priceMin && data.priceMax && (
                  <div className="flex gap-3">
                    <DollarSign className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Price Range</p>
                      <p className="text-sm text-slate-900 font-medium">
                        ₹{data.priceMin.toLocaleString()} - ₹{data.priceMax.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {data.minPrice && (
                  <div className="flex gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Starting Price</p>
                      <p className="text-sm text-slate-900 font-medium">
                        ₹{data.minPrice.toLocaleString()} / night
                      </p>
                    </div>
                  </div>
                )}
                {data.starRating && (
                  <div className="flex gap-3">
                    <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Rating</p>
                      <p className="text-sm text-slate-900 font-medium flex items-center gap-1">
                        {data.starRating} Stars {"★".repeat(Math.round(data.starRating))}
                      </p>
                    </div>
                  </div>
                )}
                {data.capacity && (
                  <div className="flex gap-3">
                    <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Capacity</p>
                      <p className="text-sm text-slate-900 font-medium">
                        Up to {data.capacity} passengers
                      </p>
                    </div>
                  </div>
                )}
                {data.vehicleModel && (
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Vehicle Model</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.vehicleModel}
                      </p>
                    </div>
                  </div>
                )}
                {data.isAC !== undefined && (
                  <div className="flex gap-3">
                    <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">A/C Status</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.isAC ? "Air Conditioned" : "Non-Air Conditioned"}
                      </p>
                    </div>
                  </div>
                )}
                {data.duration && (
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Duration</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.duration}
                      </p>
                    </div>
                  </div>
                )}
                {data.bestTimeToVisit && (
                  <div className="flex gap-3">
                    <Award className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Best Time</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {data.bestTimeToVisit}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities/Features */}
            {((data.amenities && Array.isArray(data.amenities)) || (data.features && Array.isArray(data.features))) && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-500 uppercase mb-3">
                  {type === "hotel" ? "Amenities" : "Key Features"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(data.amenities || data.features || []).map((feat: any, idx: number) => {
                    const formatted = formatAmenityName(feat);
                    if (!formatted) return null;
                    return (
                      <span key={idx} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                        {formatted}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cuisine & Specialties */}
            {((data.cuisine && Array.isArray(data.cuisine) && data.cuisine.length > 0) || (data.specialItems && Array.isArray(data.specialItems) && data.specialItems.length > 0)) && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 space-y-4">
                {data.cuisine && data.cuisine.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase mb-2">
                      Cuisines Served
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.cuisine.map((item: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-orange-50 border border-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.specialItems && data.specialItems.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase mb-2">
                      Must-Try Specialties
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.specialItems.map((item: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          😋 {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            {(data.address || data.latitude || data.longitude) && (
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-slate-900">Location</p>
                </div>
                {data.address && (
                  <p className="text-sm text-slate-700 mb-2">{data.address}</p>
                )}
                {data.latitude && data.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${data.latitude},${data.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-white rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
