import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TasksSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md ml-auto" />
      </div>

      {/* Board columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full ml-1" />
            </div>
            {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
