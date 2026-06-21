/**
 * loading.tsx — Package detail page skeleton
 * Streams immediately while the SSR of the actual detail page runs.
 */
export default function PackageDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Image Skeleton */}
      <div className="relative h-[55vh] md:h-[70vh] max-h-[680px] bg-gradient-to-br from-slate-300 to-slate-200 animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] animate-[sh-shimmer_1.8s_linear_infinite]" />

        {/* Fake breadcrumb */}
        <div className="absolute top-6 left-6 flex gap-2 items-center">
          <div className="h-3 w-16 rounded bg-white/20 animate-pulse" />
          <div className="h-3 w-2 rounded bg-white/20" />
          <div className="h-3 w-28 rounded bg-white/20 animate-pulse" />
        </div>

        {/* Bottom overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="h-6 w-24 rounded-full bg-white/20 mb-3 animate-pulse" />
          <div className="h-10 w-3/4 rounded-lg bg-white/20 mb-2 animate-pulse" />
          <div className="h-5 w-1/2 rounded bg-white/15 animate-pulse" />
          <div className="flex gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-white/15 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky tab bar skeleton */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 flex gap-6 overflow-hidden py-3">
          {["Overview", "Itinerary", "Inclusions", "Gallery", "Book"].map((label) => (
            <div key={label} className="h-5 w-20 rounded bg-slate-100 animate-pulse shrink-0" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-sm">
              <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-3 rounded bg-slate-100 animate-pulse" style={{ width: `${90 - i * 8}%` }} />
                ))}
              </div>
            </div>
            {/* Itinerary card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-sm">
              <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
                    <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar — sticky price card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 sticky top-24">
              <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
              <div className="h-10 w-40 rounded bg-slate-200 animate-pulse" />
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="h-4 w-4 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 flex-1 rounded bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-12 rounded-xl bg-primary/20 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
