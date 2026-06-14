"use client";

import React, { useState } from "react";
import { Check, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPREHENSIVE_AMENITIES,
  AMENITIES_BY_CATEGORY,
  CATEGORY_METADATA,
  type AmenityOption,
} from "@/lib/amenities-config";

interface AmenitiesSelectorProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
  compact?: boolean; // Compact mode for small displays
  gridCols?: number; // Number of columns for grid
}

/**
 * Professional Amenities Selector Component
 * - Categorized amenities (50+ items)
 * - Search functionality
 * - Category filters
 * - Compact and expanded modes
 */
export function AmenitiesSelector({
  selected,
  onChange,
  compact = true,
  gridCols = 3,
}: AmenitiesSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    compact ? null : "room-basics"
  );

  // Filter amenities based on search
  const filteredAmenities = COMPREHENSIVE_AMENITIES.filter((amenity) =>
    amenity.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    amenity.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (amenity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const toggleAmenity = (key: string) => {
    onChange(
      selected.includes(key)
        ? selected.filter((a) => a !== key)
        : [...selected, key]
    );
  };

  const selectCategory = (category: string) => {
    const categoryAmenities = AMENITIES_BY_CATEGORY[category] || [];
    const categoryKeys = categoryAmenities.map((a) => a.key);
    const allSelected = categoryKeys.every((k) => selected.includes(k));

    if (allSelected) {
      // Deselect all in category
      onChange(selected.filter((k) => !categoryKeys.includes(k)));
    } else {
      // Select all in category
      const newSelected = new Set(selected);
      categoryKeys.forEach((k) => newSelected.add(k));
      onChange(Array.from(newSelected));
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search amenities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
          />
        </div>

        {/* Compact Grid View with Professional Scrollbar */}
        <style>{`
          .amenities-scroll-container {
            scrollbar-width: auto;
            scrollbar-color: #1B3A6B #e5e7eb;
          }
          .amenities-scroll-container::-webkit-scrollbar {
            width: 12px;
          }
          .amenities-scroll-container::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 4px 0;
          }
          .amenities-scroll-container::-webkit-scrollbar-thumb {
            background: #1B3A6B;
            border-radius: 10px;
            border: 2px solid #e5e7eb;
            min-height: 40px;
          }
          .amenities-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #0f2548;
            border-color: #d1d5db;
          }
          .amenities-scroll-container::-webkit-scrollbar-thumb:active {
            background: #0a1a38;
          }
        `}</style>
        <div className="amenities-scroll-container max-h-80 overflow-y-scroll rounded-xl border-2 border-gray-300 bg-gradient-to-b from-white to-gray-50 p-3 shadow-md">
          <div className="grid gap-2 grid-cols-4 sm:grid-cols-5 md:grid-cols-5 pr-2">
            {(searchTerm ? filteredAmenities : COMPREHENSIVE_AMENITIES).map((amenity) => {
              const isSelected = selected.includes(amenity.key);
              const Icon = amenity.icon;
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  title={amenity.label}
                  aria-label={`Select ${amenity.label}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all text-center group hover:scale-110 active:scale-95",
                    isSelected
                      ? "border-[#1B3A6B] bg-blue-100 shadow-lg ring-2 ring-blue-300"
                      : "border-gray-300 bg-white hover:border-[#1B3A6B] hover:bg-blue-50 shadow-sm hover:shadow-md"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1B3A6B] rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                      <Check className="w-2 h-2 text-white stroke-[4]" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                      isSelected 
                        ? "bg-[#1B3A6B] text-white shadow-md" 
                        : "bg-gray-100 text-gray-600 group-hover:bg-[#1B3A6B] group-hover:text-white group-hover:shadow-md"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[7px] font-bold text-gray-700 leading-none line-clamp-1">
                    {amenity.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="text-center px-3 py-2 bg-blue-50 rounded-lg border border-blue-300 shadow-sm">
            <span className="text-xs font-bold text-[#1B3A6B]">
              {selected.length} / {COMPREHENSIVE_AMENITIES.length}
            </span>
            <span className="text-xs text-gray-600"> amenities selected</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search amenities by name or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
        />
      </div>

      {/* Category Tabs or Filtered Results */}
      {searchTerm ? (
        // Search Results View
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
            Search Results ({filteredAmenities.length})
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAmenities.map((amenity) => (
              <AmenityCard
                key={amenity.key}
                amenity={amenity}
                isSelected={selected.includes(amenity.key)}
                onToggle={() => toggleAmenity(amenity.key)}
              />
            ))}
          </div>
        </div>
      ) : (
        // Categorized View
        <div className="space-y-4">
          {Object.entries(AMENITIES_BY_CATEGORY)
            .filter(([_, amenities]) => amenities.length > 0)
            .map(([category, amenities]) => {
              const meta = CATEGORY_METADATA[category];
              const categorySelected = amenities.map((a) => a.key);
              const allSelected = categorySelected.every((k) =>
                selected.includes(k)
              );

              return (
                <div
                  key={category}
                  className={`border rounded-xl overflow-hidden transition-all ${meta.bgColor}`}
                >
                  <div className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity bg-inherit">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          selectCategory(category);
                        }}
                        aria-label={`Select all ${meta.label}`}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === category ? null : category
                          )
                        }
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <span className={`font-bold text-sm ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          ({selected.filter((k) => categorySelected.includes(k)).length}/{amenities.length})
                        </span>
                      </button>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 transition-transform",
                        expandedCategory === category ? "rotate-180" : "",
                        meta.color
                      )}
                    />
                  </div>

                  {expandedCategory === category && (
                    <div className="px-4 pb-4 bg-white border-t">
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {amenities.map((amenity) => (
                          <AmenityCard
                            key={amenity.key}
                            amenity={amenity}
                            isSelected={selected.includes(amenity.key)}
                            onToggle={() => toggleAmenity(amenity.key)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <p className="text-blue-900 font-semibold">
          {selected.length} of {COMPREHENSIVE_AMENITIES.length} amenities selected
        </p>
        {selected.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selected.map((key) => {
              const amenity = COMPREHENSIVE_AMENITIES.find((a) => a.key === key);
              return amenity ? (
                <span
                  key={key}
                  className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-full font-medium"
                >
                  {amenity.label}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Amenity Card Component
 */
function AmenityCard({
  amenity,
  isSelected,
  onToggle,
}: {
  amenity: AmenityOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const Icon = amenity.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={amenity.description}
      className={cn(
        "flex flex-col items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-center",
        isSelected
          ? "border-[#1B3A6B] bg-[#1B3A6B]/5"
          : "border-gray-100 bg-white hover:border-gray-300"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative",
          isSelected ? "bg-[#1B3A6B] text-white" : "bg-gray-100 text-gray-600"
        )}
      >
        <Icon className="w-5 h-5" />
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white stroke-[3]" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-900 leading-tight">
          {amenity.label}
        </p>
        {amenity.description && (
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
            {amenity.description}
          </p>
        )}
      </div>
    </button>
  );
}
