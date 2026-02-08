import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { InfiniteQueryResult } from "./infinite-scroll-list";

interface InfiniteScrollGridProps<TData> {
  /**
   * The infinite query result from tRPC useInfiniteQuery
   */
  queryResult: InfiniteQueryResult<TData>;
  /**
   * Render function for each item
   */
  renderItem: (item: TData, index: number) => React.ReactNode;
  /**
   * Number of columns in the grid
   * @default 1
   */
  columns?: number;
  /**
   * Estimated height of each row in pixels
   */
  estimateRowHeight: number;
  /**
   * Number of items to render outside of the visible area (overscan)
   * @default 3
   */
  overscan?: number;
  /**
   * Threshold in pixels from the bottom to trigger loading more
   * @default 500
   */
  scrollThreshold?: number;
  /**
   * Height of the scrollable container
   * @default "100%"
   */
  height?: string | number;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom loading more component
   */
  loadingMoreComponent?: React.ReactNode;
  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode;
  /**
   * Custom end of list component
   */
  endComponent?: React.ReactNode;
  /**
   * Get unique key for each item
   */
  getItemKey?: (item: TData, index: number) => string | number;
  /**
   * Gap between items in pixels
   * @default 0
   */
  gap?: number;
}

export function InfiniteScrollGrid<TData>({
  queryResult,
  renderItem,
  estimateRowHeight,
  columns = 1,
  overscan = 3,
  scrollThreshold = 500,
  height = "100%",
  className,
  loadingComponent,
  loadingMoreComponent,
  emptyComponent,
  endComponent,
  getItemKey,
  gap = 0,
}: InfiniteScrollGridProps<TData>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Flatten all pages data into a single array
  const flatData = React.useMemo(() => {
    return queryResult.data?.pages.flatMap((page) => page.data) ?? [];
  }, [queryResult.data]);

  // Calculate rows
  const rowCount = Math.ceil(flatData.length / columns);
  const hasLoaderRow = queryResult.hasNextPage;

  // Virtualizer for rows
  const virtualizer = useVirtualizer({
    count: hasLoaderRow ? rowCount + 1 : rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    gap,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Infinite scroll
  React.useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (
        distanceFromBottom < scrollThreshold &&
        queryResult.hasNextPage &&
        !queryResult.isFetchingNextPage
      ) {
        queryResult.fetchNextPage();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [
    queryResult.hasNextPage,
    queryResult.isFetchingNextPage,
    queryResult.fetchNextPage,
    scrollThreshold,
    queryResult,
  ]);

  // Initial loading state
  if (queryResult.isLoading) {
    return (
      loadingComponent ?? (
        <div
          className={cn("flex items-center justify-center", className)}
          style={{ height }}
        >
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  // Empty state
  if (flatData.length === 0) {
    return (
      emptyComponent ?? (
        <EmptyState
          icon={Inbox}
          title="Tidak ada data"
          description="Data tidak tersedia saat ini"
          className={className}
        />
      )
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= rowCount;

          if (isLoaderRow) {
            return (
              <div
                key="loader"
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {queryResult.hasNextPage
                  ? (loadingMoreComponent ?? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      </div>
                    ))
                  : (endComponent ?? null)}
              </div>
            );
          }

          // Get items for this row
          const startIndex = virtualRow.index * columns;
          const rowItems = flatData.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 grid w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startIndex + colIndex;
                const key = getItemKey
                  ? getItemKey(item, itemIndex)
                  : itemIndex;

                return <div key={key}>{renderItem(item, itemIndex)}</div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
