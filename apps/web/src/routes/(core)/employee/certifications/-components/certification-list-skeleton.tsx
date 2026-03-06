import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader shown while certification data is being fetched.
 * Renders in a grid matching the certification card grid layout.
 */
export function CertificationListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no real keys
          key={i}
          className="rounded-xl border border-border bg-background p-3"
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mb-2 h-3 w-28" />
          <div className="mb-3 flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
