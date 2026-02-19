import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TeamSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Search */}
      <Skeleton className="h-8 w-64 rounded-md" />

      {/* Desktop table skeleton */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20 ml-auto" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-3.5 w-8" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-5 w-24 rounded-full ml-auto" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mobile cards skeleton */}
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
