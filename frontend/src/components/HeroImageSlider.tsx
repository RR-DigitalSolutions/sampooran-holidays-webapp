"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { validateImageUrl } from "@/lib/utils";

interface HeroImageSliderProps {
  images: string[];
  alt: string;
}

/**
 * HeroImageSlider
 * ───────────────
 * Smooth cross-fade slide show — images slide every 3 seconds.
 * No Ken Burns zoom — pure opacity cross-fade for a clean, premium look.
 * Navigation arrows, dot progress indicators, and image counter badge included.
 */
export function HeroImageSlider({ images, alt }: HeroImageSliderProps) {
  const validImages = images.filter((img) => !!img).map((img) => validateImageUrl(img));
  const total = validImages.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const SLIDE_INTERVAL = 3000; // 3 seconds per slide
  const FADE_DURATION = 800;   // cross-fade duration in ms

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || total <= 1) return;
      const next = (index + total) % total;
      setPrevIndex(currentIndex);
      setCurrentIndex(next);
      setIsTransitioning(true);

      setTimeout(() => {
        setPrevIndex(null);
        setIsTransitioning(false);
      }, FADE_DURATION + 100);
    },
    [currentIndex, isTransitioning, total]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-advance every 3 seconds
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
      {/* ── Slides — pure cross-fade, no zoom ── */}
      {validImages.map((image, idx) => {
        const isActive = idx === currentIndex;
        const isPrev = idx === prevIndex;
        const isVisible = isActive || isPrev;

        return (
          <div
            key={idx}
            className="absolute inset-0"
            style={{
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
              opacity: isActive ? 1 : isPrev ? 0 : 0,
              transition: isVisible
                ? `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
                : "none",
              willChange: "opacity",
            }}
          >
            <Image
              src={validateImageUrl(image, 1920, 1080, "16:9")}
              alt={`${alt} ${idx + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={idx === 0}
            />
          </div>
        );
      })}

      {/* ── Navigation arrows ── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2.5 rounded-full bg-black/30 hover:bg-black/55 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-1 sm:p-2.5 rounded-full bg-black/30 hover:bg-black/55 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5" />
          </button>

          {/* ── Slide progress dot indicators ── */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: idx === currentIndex ? 32 : 10 }}
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span className="absolute inset-0 rounded-full bg-white/35" />
                {idx === currentIndex && (
                  <span
                    className="absolute inset-0 rounded-full bg-white"
                    style={{
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
              from { transform: scaleX(0); transform-origin: left; }
              to   { transform: scaleX(1); transform-origin: left; }
            }
          `}</style>

          {/* ── Image counter badge ── */}
          <div className="absolute top-4 right-4 z-20 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 px-3 py-1 text-xs font-semibold text-white/80">
            {currentIndex + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}
