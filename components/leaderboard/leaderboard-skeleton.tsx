export default function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Podium skeleton */}
      <div className="flex justify-center items-end gap-4">
        {[44, 52, 44].map((h, i) => (
          <div
            key={i}
            style={{ height: h * 4 }}
            className="w-44 rounded-2xl bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
