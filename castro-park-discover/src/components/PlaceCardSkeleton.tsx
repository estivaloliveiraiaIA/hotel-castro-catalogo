export const PlaceCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-2.5">
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-5 w-2/3 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-4/5 bg-muted rounded" />
      <div className="h-8 w-28 bg-muted rounded-full mt-3" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <PlaceCardSkeleton key={i} />
    ))}
  </div>
);
