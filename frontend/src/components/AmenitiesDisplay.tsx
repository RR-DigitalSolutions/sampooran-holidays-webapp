"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getAmenityInfo, CATEGORY_METADATA } from "@/lib/amenities-config";

interface AmenitiesDisplayProps {
  amenities: string[];
  showCategory?: boolean;
  compact?: boolean;
  maxVisible?: number;
}

/**
 * Amenities Display Component
 * Shows amenities with icons in a professional, organized layout
 * Perfect for hotel detail pages and listings
 */
export function AmenitiesDisplay({
  amenities,
  showCategory = false,
  compact = false,
  maxVisible,
}: AmenitiesDisplayProps) {
  if (!amenities || amenities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm font-medium">No amenities listed</p>
      </div>
    );
  }

  const displayAmenities = maxVisible ? amenities.slice(0, maxVisible) : amenities;
  const hiddenCount = maxVisible && amenities.length > maxVisible ? amenities.length - maxVisible : 0;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayAmenities.map((key) => {
          const amenity = getAmenityInfo(key);
          if (!amenity) return null;
          const Icon = amenity.icon;
          return (
            <div
              key={key}
              title={amenity.description}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5"
            >
              <Icon className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">{amenity.label}</span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-600">+{hiddenCount} more</span>
          </div>
        )}
      </div>
    );
  }

  // Organize by category if requested
  if (showCategory) {
    const byCategory: Record<string, typeof displayAmenities> = {};
    displayAmenities.forEach((key) => {
      const amenity = getAmenityInfo(key);
      if (amenity) {
        if (!byCategory[amenity.category]) {
          byCategory[amenity.category] = [];
        }
        byCategory[amenity.category].push(key);
      }
    });

    return (
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, keys]) => {
          const meta = CATEGORY_METADATA[category];
          return (
            <div key={category}>
              <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-2.5", meta.color)}>
                {meta.label}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {keys.map((key) => {
                  const amenity = getAmenityInfo(key);
                  if (!amenity) return null;
                  const Icon = amenity.icon;
                  return (
                    <div
                      key={key}
                      title={amenity.description}
                      className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg p-2.5 hover:border-slate-200 transition-colors"
                    >
                      <div className="p-1.5 bg-slate-50 rounded-lg shrink-0">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 line-clamp-2">{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid view - simple and professional
  return (
    <div className="flex flex-wrap gap-2.5">
      {displayAmenities.map((key) => {
        const amenity = getAmenityInfo(key);
        if (!amenity) return null;
        const Icon = amenity.icon;
        return (
          <div
            key={key}
            title={amenity.description}
            className="inline-flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2 hover:shadow-sm hover:border-slate-200 transition-all whitespace-nowrap"
          >
            <div className="p-1 bg-slate-50 rounded-md shrink-0">
              <Icon className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{amenity.label}</span>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-slate-600">+{hiddenCount} more</span>
        </div>
      )}
    </div>
  );
}

/**
 * Featured Amenities Component
 * Shows a selection of key amenities as large icon cards
 * Perfect for above-the-fold hotel highlights
 */
export function FeaturedAmenities({ amenities }: { amenities: string[] }) {
  // Select featured amenities (popular ones that exist in the property)
  const FEATURED_ORDER = [
    "WIFI",
    "POOL",
    "RESTAURANT",
    "PARKING",
    "GYM",
    "BREAKFAST",
  ];

  const featured = FEATURED_ORDER.filter((key) => amenities.includes(key)).slice(0, 4);

  if (featured.length === 0) return null;

  const FEATURED_LABELS: Record<string, { label: string; value: string }> = {
    WIFI: { label: "Free Wi-Fi", value: "High Speed" },
    POOL: { label: "Pool", value: "Swimming" },
    RESTAURANT: { label: "Dining", value: "On-site" },
    PARKING: { label: "Parking", value: "Complimentary" },
    GYM: { label: "Fitness", value: "Equipped" },
    BREAKFAST: { label: "Breakfast", value: "Included" },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {featured.map((key) => {
        const amenity = getAmenityInfo(key);
        const display = FEATURED_LABELS[key];
        if (!amenity || !display) return null;
        const Icon = amenity.icon;
        return (
          <div
            key={key}
            className="bg-slate-50 p-3 rounded-lg border border-slate-100/50 flex gap-3 items-start"
          >
            <div className="p-2 bg-sky-50 text-[#1B3A6B] rounded-lg flex-shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {display.label}
              </p>
              <p className="text-xs font-black text-slate-700 mt-0.5">{display.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
