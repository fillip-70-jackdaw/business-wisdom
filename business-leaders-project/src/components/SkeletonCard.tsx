export function SkeletonCard() {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 bg-white/10 rounded" />
          <div className="h-2.5 w-32 bg-white/10 rounded" />
        </div>
      </div>

      {/* Text skeleton */}
      <div className="space-y-2.5">
        <div className="h-5 bg-white/10 rounded w-full" />
        <div className="h-5 bg-white/10 rounded w-11/12" />
        <div className="h-5 bg-white/10 rounded w-9/12" />
      </div>

      {/* Meta skeleton */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-3 w-16 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
    </div>
  );
}
