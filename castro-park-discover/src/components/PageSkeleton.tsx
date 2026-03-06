export const PageSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    {/* Header */}
    <div className="h-16 bg-muted/30 border-b" />
    {/* Hero placeholder */}
    <div className="h-40 bg-muted/20" />
    {/* Grid */}
    <div className="container px-4 py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <div className="aspect-[4/3] bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-4/5 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
