/**
 * useCarouselGuide
 *
 * ONE-TIME smart carousel guide (MakeMyTrip-style).
 *
 * Behaviour:
 *  1. Uses IntersectionObserver — zero CPU cost when off-screen.
 *  2. Checks localStorage: if this sectionId was already guided, skips entirely.
 *  3. When section enters viewport (>=30% visible), waits `waitMs` idle.
 *  4. If user has NOT interacted: performs one peek forward + reverse.
 *  5. Sets localStorage flag so the guide NEVER runs again on any visit.
 *  6. Any user pointer interaction cancels and permanently dismisses the guide.
 *  7. Returns `showHint` boolean so the carousel can render a "Swipe" pill.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type useEmblaCarousel from "embla-carousel-react";

type EmblaApi = ReturnType<typeof useEmblaCarousel>[1];

const STORAGE_PREFIX = "sh_guide_seen_";

interface UseCarouselGuideOptions {
  emblaRef: React.RefObject<HTMLDivElement | null>;
  emblaApi: EmblaApi;
  sectionId: string;   // unique key per section e.g. "packages" | "hotels" | "fleet" | "themes"
  waitMs?: number;
}

export function useCarouselGuide({
  emblaRef,
  emblaApi,
  sectionId,
  waitMs = 3000,
}: UseCarouselGuideOptions) {
  const storageKey = STORAGE_PREFIX + sectionId;
  const hasPeeked = useRef(false);
  const userInteracted = useRef(false);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Cancel guide on user interaction
  const cancelGuide = useCallback(() => {
    userInteracted.current = true;
    setShowHint(false);
    if (waitTimer.current) {
      clearTimeout(waitTimer.current);
      waitTimer.current = null;
    }
    try { localStorage.setItem(storageKey, "1"); } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!emblaApi) return;
    const onPointerDown = () => cancelGuide();
    emblaApi.on("pointerDown", onPointerDown);
    return () => { emblaApi.off("pointerDown", onPointerDown); };
  }, [emblaApi, cancelGuide]);

  useEffect(() => {
    const el = emblaRef.current;
    if (!el || !emblaApi) return;

    // Already guided in a previous session — skip
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {}

    const runPeek = () => {
      if (hasPeeked.current || userInteracted.current || !emblaApi) return;
      hasPeeked.current = true;

      // Show swipe hint pill
      setShowHint(true);

      // Peek forward
      emblaApi.scrollNext();

      // Reverse after 700ms
      setTimeout(() => {
        if (!userInteracted.current && emblaApi) {
          emblaApi.scrollPrev();
        }
        // Hide hint after guide completes
        setTimeout(() => setShowHint(false), 1200);
      }, 700);

      // Mark as seen permanently
      try { localStorage.setItem(storageKey, "1"); } catch {}
    };

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasPeeked.current && !userInteracted.current) {
          waitTimer.current = setTimeout(runPeek, waitMs);
        } else {
          if (waitTimer.current) {
            clearTimeout(waitTimer.current);
            waitTimer.current = null;
          }
        }
      },
      { threshold: 0.30 }
    );

    observer.current.observe(el);

    return () => {
      observer.current?.disconnect();
      if (waitTimer.current) clearTimeout(waitTimer.current);
    };
  }, [emblaApi, emblaRef, waitMs, storageKey]);

  return { showHint };
}