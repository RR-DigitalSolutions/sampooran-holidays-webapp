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
 * HeroImageSlider
 * ───────────────
 * Cinematic zoom-in slider that feels like a video.
 *
 * Technique:
 *  • Every slide has an `animKey` counter. When a slide becomes "active"
 *    its animKey is bumped, which changes the React `key` on the animated
 *    div → React unmounts and remounts it → CSS animation restarts from 0%.
 *  • The outgoing slide is kept in the DOM with opacity 0 (cross-fade)
 *    but its animKey is NOT changed so the zoom freezes naturally at
 *    whatever scale it reached — no snap-back, no glitch.
 *  • Zoom direction: push-IN (scale 1.0 → 1.12), slow (matches slide interval).
 */
export function HeroImageSlider({ images, alt }: HeroImageSliderProps) {
  const validImages = images.filter(validateImageUrl);
  const total = validImages.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Track per-slide animation keys so we can force-restart the zoom animation
  // when a slide becomes active without disturbing other slides.
  const animKeysRef = useRef<number[]>(validImages.map(() => 0));
  const [, forceRender] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || total <= 1) return;
      const next = (index + total) % total;
      setPrevIndex(currentIndex);
      setCurrentIndex(next);
      setIsTransitioning(true);

      // Bump the animKey for the incoming slide → forces CSS animation restart
      animKeysRef.current[next] += 1;
      forceRender((n) => n + 1);

      setTimeout(() => {
        setPrevIndex(null);
        setIsTransitioning(false);
      }, 1200); // match the opacity cross-fade duration
    },
    [currentIndex, isTransitioning, total]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPaused, next, total]);

  if (total === 0) return null;

  const ZOOM_DURATION = 7500; // ms — slightly longer than slide interval for smooth feel

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Slides ── */}
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
              // Cross-fade: active fades in, prev fades out, rest stay hidden
              opacity: isActive ? 1 : isPrev ? 0 : 0,
              transition: isVisible
                ? "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
              willChange: "opacity",
            }}
          >
            {/*
              The key here is critical:
              – For the ACTIVE slide: key changes every time it becomes active
                → React unmounts & remounts → animation starts from scale(1.0)
              – For all other slides: key is stable → animation stays wherever it stopped
            */}
            <div
              key={`anim-${idx}-${animKeysRef.current[idx]}`}
              className="absolute inset-0"
              style={{
                animation: `heroZoomIn ${ZOOM_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                willChange: "transform",
              }}
            >
              <Image
                src={validateImageUrl(image)}
                alt={`${alt} ${idx + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          </div>
        );
      })}

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes heroZoomIn {
          0%   { transform: scale(1.00); }
          100% { transform: scale(1.13); }
        }
      `}</style>

      {/* ── Navigation arrows ── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/30 hover:bg-black/55 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/30 hover:bg-black/55 text-white transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* ── Slide progress indicators ── */}
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
                        ? "slideProgress 6s linear forwards"
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
