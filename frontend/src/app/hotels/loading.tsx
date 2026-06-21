/**
 * loading.tsx — Hotels listing skeleton
 */
export default function HotelsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div className="relative h-48 md:h-60 bg-gradient-to-br from-primary/80 to-primary animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.07)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.6s_linear_infinite]" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center gap-3">
          <div className="h-8 w-60 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-44 rounded bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <HotelCardSkeleton key={i} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HotelCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image */}
      <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-100 relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.8s_linear_infinite]" />
        <div className="absolute top-4 left-4 h-6 w-20 rounded-full bg-white/30 animate-pulse" />
        <div className="absolute bottom-4 left-4 h-4 w-28 rounded bg-white/20 animate-pulse" />
      </div>
      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
          <div>
            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse mb-1" />
            <div className="h-7 w-28 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
