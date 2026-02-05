import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {/* Date/time skeleton */}
          <div className="w-14 space-y-1 text-right">
            <Skeleton className="ml-auto h-3 w-12" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          {/* Dot and line */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            {i < 3 && <Skeleton className="mt-1 h-12 w-0.5" />}
          </div>
          {/* Label skeleton */}
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <Card className="w-full pt-0">
      {/* Back button skeleton */}
      {/* <Skeleton className="mb-4 h-5 w-48" /> */}

      {/* Header badge skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-40 rounded-md rounded-tr-none rounded-bl-none" />
        {/* <Skeleton className="h-6 w-24 rounded-full" /> */}
      </div>

      {/* Main content grid */}
      <div className="flex flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        {/* Timeline skeleton */}
        <div className="w-full overflow-x-auto pt-4 md:w-auto md:overflow-visible">
          <OrderTimelineSkeleton />
        </div>

        {/* Content card skeleton */}
        <Card className="flex-1 rounded-2xl p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 sm:w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-28" />
            </div>

            {/* Description */}
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-6 h-4 w-3/4" />

            {/* Document skeleton */}
            <Skeleton className="h-16 w-full rounded-xl sm:w-72" />

            {/* Action buttons skeleton */}
            <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Skeleton className="h-10 w-full rounded-md sm:w-30" />
              <Skeleton className="h-10 w-full rounded-md sm:w-30" />
              <Skeleton className="h-10 w-full rounded-md sm:w-30" />
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
