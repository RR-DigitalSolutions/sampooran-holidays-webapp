/**
 * loading.tsx — Packages listing page skeleton
 * Shows instantly while Next.js fetches/renders the real page server-side.
 * This eliminates the "blank / stuck" feeling entirely.
 */
export default function PackagesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero skeleton */}
      <div className="relative h-52 md:h-64 bg-gradient-to-br from-primary/80 to-primary animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.07)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.5s_linear_infinite]" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center gap-3">
          <div className="h-8 w-64 rounded-lg bg-white/10" />
          <div className="h-4 w-48 rounded bg-white/10" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-slate-100 animate-pulse shrink-0" />
          ))}
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <PackageCardSkeleton key={i} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PackageCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-100 relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.8s_linear_infinite]" />
        {/* Badge placeholders */}
        <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-white/30" />
        <div className="absolute bottom-3 left-3 h-4 w-24 rounded bg-white/20" />
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-3 w-10 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-4 w-4/5 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
        <div className="border-t border-slate-50 pt-3 flex items-end justify-between">
          <div>
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse mb-1" />
            <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="h-10 w-10 rounded-md bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
