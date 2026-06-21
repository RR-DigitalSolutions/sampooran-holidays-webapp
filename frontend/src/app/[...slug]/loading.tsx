/**
 * loading.tsx — Catch-all dynamic route skeleton
 * Covers /[destination], /[package-name]-tour-packages, /[theme] etc.
 * Renders immediately with a content-shaped skeleton so the user sees
 * structure within 16ms of clicking any link.
 */
export default function DynamicSlugLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero skeleton — covers both destination and package hero patterns */}
      <div className="relative h-[55vh] md:h-[65vh] max-h-[620px] bg-gradient-to-br from-slate-800 to-slate-600 overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_2s_linear_infinite]" />

        {/* Breadcrumb skeleton */}
        <div className="absolute top-6 left-4 md:left-10 flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-white/15 animate-pulse" />
          <div className="h-3 w-2 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/15 animate-pulse" />
        </div>

        {/* Bottom hero text area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-3">
          {/* Category pill */}
          <div className="h-6 w-28 rounded-full bg-white/15 animate-pulse" />
          {/* Title */}
          <div className="h-10 md:h-14 w-2/3 rounded-xl bg-white/20 animate-pulse" />
          {/* Subtitle */}
          <div className="h-4 w-1/2 rounded bg-white/15 animate-pulse" />
          {/* Stat chips */}
          <div className="flex gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky filter / tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex gap-4 overflow-hidden">
          {[120, 80, 100, 90, 110].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-slate-100 animate-pulse shrink-0" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-44 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} delay={i * 0.04} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-100 relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.45)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.9s_linear_infinite]" />
        <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-white/30 animate-pulse" />
        <div className="absolute bottom-3 left-3 h-4 w-24 rounded bg-white/20 animate-pulse" />
      </div>
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-4/5 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
        <div className="flex gap-2 pt-1">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-3 w-10 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-9 w-9 rounded-md bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
