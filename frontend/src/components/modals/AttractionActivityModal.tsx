"use client";

import { useState } from "react";
import { X, MapPin, Clock, DollarSign, Award, Lightbulb, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn, validateImageUrl } from "@/lib/utils";

type AttractionActivityModalProps = {
  type: "attraction" | "activity";
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

  const images = data.images && Array.isArray(data.images) ? data.images : [];
  const allImages = data.coverImage
    ? [data.coverImage, ...images].filter(Boolean)
    : images;

  const highlights = Array.isArray(data.highlights) ? data.highlights : [];
  const tips = Array.isArray(data.tips) ? data.tips : [];
  const famousFor = Array.isArray(data.famousFor) ? data.famousFor : [];

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-white rounded-t-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {type === "attraction" ? "Attraction" : "Activity"}
                </span>
                {data.type && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                    {data.type}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                {data.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-220px)]">
            {/* Gallery */}
            {allImages.length > 0 && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-500 uppercase mb-4">
                  Gallery
                </p>
                {allImages.length === 1 ? (
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video">
                    <img
                      src={validateImageUrl(allImages[0])}
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allImages.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg overflow-hidden bg-slate-100 aspect-square"
                      >
                        <img
                          src={validateImageUrl(img)}
                          alt={`${data.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {data.shortDescription && (
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {data.shortDescription}
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
