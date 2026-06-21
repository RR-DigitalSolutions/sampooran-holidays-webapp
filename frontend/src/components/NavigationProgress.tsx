"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Sampooran Holidays – Navigation Progress Bar
 * ─────────────────────────────────────────────
 * A premium travel-themed top-of-page progress bar that fires the instant the
 * user clicks any link and finishes when the new page renders. Works entirely
 * via Next.js App Router pathname/searchParam change detection – no third-party
 * library needed.
 *
 * Design: Amber-gold gradient that matches the brand accent colour, with a
 * subtle animated shimmer ("sunlight on a mountain lake") and a tiny ✈ plane
 * icon that slides across the bar.
 */

function useNavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setIsVisible(true);
    setProgress(5);

    // Simulate realistic incremental progress
    let current = 5;
    timerRef.current = setInterval(() => {
      // Easing: fast early, slows near 85%, never reaches 100 until done
      const increment = current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : 0.5;
      current = Math.min(current + increment, 88);
      setProgress(current);
    }, 150);
  }, [clearTimers]);

  const completeProgress = useCallback(() => {
    clearTimers();
    setProgress(100);
    completeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 400);
  }, [clearTimers]);

  // Detect navigation START by intercepting all link clicks & form submits
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (target.getAttribute("target") === "_blank") return;
      // Only start for same-origin navigations
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        startProgress();
      } catch {
        // relative url
        startProgress();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startProgress]);

  // Detect navigation COMPLETE via pathname/searchParams change
  useEffect(() => {
    const current = `${pathname}?${searchParams.toString()}`;
    if (prevPathRef.current !== null && prevPathRef.current !== current) {
      completeProgress();
    }
    prevPathRef.current = current;
  }, [pathname, searchParams, completeProgress]);

  return { progress, isVisible };
}

export function NavigationProgress() {
  const { progress, isVisible } = useNavigationProgress();

  if (!isVisible && progress === 0) return null;

  return (
    <>
      {/* Progress bar */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 99999,
          height: "3px",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #F5A623 0%, #FFD166 40%, #F5A623 70%, #E8860A 100%)",
          backgroundSize: "200% 100%",
          boxShadow: "0 0 12px 2px rgba(245,166,35,0.7), 0 0 4px rgba(245,166,35,0.5)",
          transition: progress === 100 ? "width 0.25s ease-out, opacity 0.4s ease 0.25s" : "width 0.15s ease-out",
          opacity: isVisible ? 1 : 0,
          animation: progress > 5 && progress < 100 ? "sh-shimmer 1.5s linear infinite" : "none",
          borderRadius: "0 2px 2px 0",
        }}
      />

      {/* Tiny plane icon riding the tip of the bar */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-4px",
          left: `${Math.max(progress - 2, 0)}%`,
          zIndex: 100000,
          transform: "translateX(-50%)",
          fontSize: "14px",
          lineHeight: 1,
          opacity: isVisible && progress > 5 && progress < 98 ? 1 : 0,
          transition: progress === 100 ? "opacity 0.2s ease" : "left 0.15s ease-out, opacity 0.2s ease",
          filter: "drop-shadow(0 0 4px rgba(245,166,35,0.9))",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        ✈
      </div>
    </>
  );
}
