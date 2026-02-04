import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <Skeleton className="size-10 shrink-0 rounded-xl" />

        {/* Content skeleton */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="size-2 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="size-8 rounded" />
          <Skeleton className="size-5 rounded" />
        </div>
      </div>
    </Card>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationCardSkeleton key={i} />
      ))}
    </div>
  );
}
