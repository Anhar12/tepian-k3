import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon skeleton */}
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            {/* Order number skeleton */}
            <Skeleton className="h-4 w-32" />
            {/* Date and amount skeleton */}
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Badge skeleton */}
          <Skeleton className="h-6 w-24 rounded-full" />
          {/* Chevron skeleton */}
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </Card>
  );
}

export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}
