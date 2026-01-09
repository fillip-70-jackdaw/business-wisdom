export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-[var(--surface-2)]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 bg-[var(--surface-2)] rounded" />
          <div className="h-2.5 w-32 bg-[var(--surface-2)] rounded" />
        </div>
      </div>

      {/* Text skeleton */}
      <div className="space-y-2.5">
        <div className="h-5 bg-[var(--surface-2)] rounded w-full" />
        <div className="h-5 bg-[var(--surface-2)] rounded w-11/12" />
        <div className="h-5 bg-[var(--surface-2)] rounded w-9/12" />
      </div>

      {/* Meta skeleton */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-3 w-16 bg-[var(--surface-2)] rounded" />
        <div className="h-3 w-20 bg-[var(--surface-2)] rounded" />
      </div>
    </div>
  );
}
