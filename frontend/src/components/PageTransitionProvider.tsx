"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavigationProgress } from "./NavigationProgress";

/**
 * PageTransitionOverlay
 * ─────────────────────
 * Wraps children with a subtle cross-fade when the route changes.
 * Also provides the click-reactive plane progress bar via NavigationProgress.
 *
 * Used in layout.tsx — wraps the whole <Layout>.
 */

function PageTransitionInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Fade out slightly (not to 0 – keeps content visible, avoids jarring blank)
    setOpacity(0.75);
    setIsTransitioning(true);

    const t = setTimeout(() => {
      setDisplayChildren(children);
      setOpacity(1);
      setIsTransitioning(false);
    }, 80); // Very short — just enough for the eye to register "something changed"

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keep children up-to-date without transition when they change for other reasons
  useEffect(() => {
    if (!isTransitioning) {
      setDisplayChildren(children);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div
      style={{
        opacity,
        transition: "opacity 0.12s ease",
        willChange: "opacity",
        minHeight: "inherit",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      {displayChildren}
    </div>
  );
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={<>{children}</>}>
        <PageTransitionInner>{children}</PageTransitionInner>
      </Suspense>
    </>
  );
}
