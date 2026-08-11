"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { validateImageUrl } from "@/lib/utils";

interface HeroImageSliderProps {
  images: string[];
  alt: string;
}

/**
 * HeroImageSlider — Pure horizontal slide, zero zoom/scale
 * ─────────────────────────────────────────────────────────
 * • All slides sit in a horizontal strip; the strip translates left/right
 *   via CSS transform — no per-image animation, no zoom, no blur.
 * • Transition: 700 ms ease-in-out cubic-bezier for a silky slide feel.
 * • Single image: renders perfectly without arrows, dots, or counter.
 * • Multiple images: auto-advances every 4 s, pauses on hover.
 *   Navigation arrows, animated progress dots, image counter badge.
 * • Touch/swipe support: drag > 40 px triggers next/prev slide.
 */
export function HeroImageSlider({ images, alt }: HeroImageSliderProps) {
  const validImages = images.filter(Boolean).map((img) => validateImageUrl(img));
  const total = validImages.length;

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const SLIDE_INTERVAL  = 4000; // ms between auto-advances
  const TRANSITION_MS   = 700;  // ms slide transition

  // Touch / swipe tracking
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || total <= 1) return;
      const next = (index + total) % total;
      setIsAnimating(true);
      setCurrent(next);
      setTimeout(() => setIsAnimating(false), TRANSITION_MS);
    },
    [isAnimating, total]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next, total]);

  if (total === 0) return null;

  // ── Single image — clean static display, no chrome ──
  if (total === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={validateImageUrl(validImages[0], 1920, 1080, "16:9")}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  // ── Multi-image horizontal slide strip ──
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -40) next();
        else if (dx > 40) prev();
        touchStartX.current = null;
      }}
    >
      {/*
        Horizontal strip — all images laid side-by-side.
        Translating the strip left by (current * 100%) reveals the active slide.
        This is a pure CSS transform — no zoom, no scale, crisp at every size.
      */}
      <div
        className="flex h-full"
        style={{
          width: `${total * 100}%`,
          transform: `translateX(-${(current * 100) / total}%)`,
          transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.45, 0.02, 0.09, 1)`,
          willChange: "transform",
        }}
      >
        {validImages.map((image, idx) => (
          <div
            key={idx}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / total}%` }}
          >
            <Image
              src={validateImageUrl(image, 1920, 1080, "16:9")}
              alt={`${alt} — photo ${idx + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {/* ── Left arrow ── */}
      <button
        onClick={prev}
        disabled={isAnimating}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/65 disabled:opacity-50 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 active:scale-95"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ── Right arrow ── */}
      <button
        onClick={next}
        disabled={isAnimating}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/65 disabled:opacity-50 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 active:scale-95"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ── Progress dot indicators ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {validImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="relative overflow-hidden rounded-full transition-all duration-500 ease-out"
            style={{
              height: 3,
              width: idx === current ? 32 : 10,
              background: idx === current ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.25)",
            }}
          >
            {idx === current && (
              <span
                className="absolute inset-0 rounded-full bg-white"
                style={{
                  transformOrigin: "left",
                  animation: !isPaused
                    ? `slideProgress ${SLIDE_INTERVAL}ms linear forwards`
                    : undefined,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Image counter badge ── */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white/85 flex items-center gap-1.5 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
        {current + 1} / {total}
      </div>

      <style>{`
        @keyframes slideProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
