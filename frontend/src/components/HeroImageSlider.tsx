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
 * HeroImageSlider — Cinematic cross-fade with subtle pan motion
 * ─────────────────────────────────────────────────────────────
 * • Each slide cross-fades smoothly (1.2 s ease-in-out) every 5 s
 * • Active slide gets a gentle horizontal pan (translateX 0% → -2%)
 *   so the imagery feels alive without the aggressive zoom effect
 * • Outgoing slide freezes at its current pan position — no snap-back
 * • Per-slide animKey forces the CSS animation to restart from 0%
 *   each time a slide becomes active (React key trick)
 * • Pauses on hover; resumes on mouse leave
 * • Navigation arrows, dot progress bar, image counter badge
 */
export function HeroImageSlider({ images, alt }: HeroImageSliderProps) {
  const validImages = images.filter(Boolean).map((img) => validateImageUrl(img));
  const total = validImages.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Per-slide animation keys — bump when a slide becomes active
  // so the pan animation restarts cleanly each time
  const animKeysRef = useRef<number[]>(validImages.map(() => 0));
  const [, forceRender] = useState(0);

  const SLIDE_INTERVAL  = 5000;  // ms between auto-advances
  const FADE_DURATION   = 1200;  // ms opacity cross-fade
  const PAN_DURATION    = 5800;  // ms pan animation (slightly longer than interval)

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || total <= 1) return;
      const next = (index + total) % total;
      setPrevIndex(currentIndex);
      setCurrentIndex(next);
      setIsTransitioning(true);

      // Bump animKey so incoming slide's CSS animation restarts
      animKeysRef.current[next] += 1;
      forceRender((n) => n + 1);

      setTimeout(() => {
        setPrevIndex(null);
        setIsTransitioning(false);
      }, FADE_DURATION + 150);
    },
    [currentIndex, isTransitioning, total]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next, total]);

  if (total === 0) return null;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Slides ── */}
      {validImages.map((image, idx) => {
        const isActive = idx === currentIndex;
        const isPrev   = idx === prevIndex;
        const isVisible = isActive || isPrev;

        return (
          <div
            key={idx}
            className="absolute inset-0"
            style={{
              zIndex:  isActive ? 2 : isPrev ? 1 : 0,
              opacity: isActive ? 1 : isPrev ? 0 : 0,
              transition: isVisible
                ? `opacity ${FADE_DURATION}ms cubic-bezier(0.45, 0, 0.25, 1)`
                : "none",
              willChange: "opacity",
            }}
          >
            {/*
              Inner wrapper carries the pan animation.
              key changes every time this slide becomes active → React unmounts
              and remounts → CSS animation restarts from translateX(0%).
              For non-active slides the key stays stable so pan freezes in place.
            */}
            <div
              key={`pan-${idx}-${animKeysRef.current[idx]}`}
              className="absolute inset-0"
              style={{
                animation: `heroPan ${PAN_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                willChange: "transform",
              }}
            >
              <Image
                src={validateImageUrl(image, 1920, 1080, "16:9")}
                alt={`${alt} — photo ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          </div>
        );
      })}

      {/* Shared keyframe — subtle right-to-left pan (0% → -2%) */}
      <style>{`
        @keyframes heroPan {
          0%   { transform: scale(1.04) translateX(0%);   }
          100% { transform: scale(1.00) translateX(-2%);  }
        }
      `}</style>

      {/* ── Navigation arrows ── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110 hover:border-white/40 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110 hover:border-white/40 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ── Dot progress indicators ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className="relative h-[3px] rounded-full overflow-hidden transition-all duration-500 ease-out"
                style={{ width: idx === currentIndex ? 36 : 12 }}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {/* Track */}
                <span className="absolute inset-0 rounded-full bg-white/30" />
                {/* Active fill bar */}
                {idx === currentIndex && (
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

          <style>{`
            @keyframes slideProgress {
              from { transform: scaleX(0); }
              to   { transform: scaleX(1); }
            }
          `}</style>

          {/* ── Image counter badge ── */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white/85 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            {currentIndex + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}
