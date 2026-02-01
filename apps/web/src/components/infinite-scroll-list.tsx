import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CursorPaginationResult<TData> {
  data: TData[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface InfiniteQueryResult<TData> {
  data:
    | {
        pages: CursorPaginationResult<TData>[];
        pageParams: unknown[];
      }
    | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

interface InfiniteScrollListProps<TData> {
  /**
   * The infinite query result from tRPC useInfiniteQuery
   */
  queryResult: InfiniteQueryResult<TData>;
  /**
   * Render function for each item
   */
  renderItem: (item: TData, index: number) => React.ReactNode;
  /**
   * Estimated size of each item in pixels (for virtualization)
   */
  estimateSize: number;
  /**
   * Number of items to render outside of the visible area (overscan)
   * @default 5
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
   * Direction of the list
   * @default "vertical"
   */
  direction?: "vertical" | "horizontal";
  /**
   * Gap between items in pixels
   * @default 0
   */
  gap?: number;
}

export function InfiniteScrollList<TData>({
  queryResult,
  renderItem,
  estimateSize,
  overscan = 5,
  scrollThreshold = 500,
  height = "100%",
  className,
  loadingComponent,
  loadingMoreComponent,
  emptyComponent,
  endComponent,
  getItemKey,
  direction = "vertical",
  gap = 0,
}: InfiniteScrollListProps<TData>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Flatten all pages data into a single array
  const flatData = React.useMemo(() => {
    return queryResult.data?.pages.flatMap((page) => page.data) ?? [];
  }, [queryResult.data]);

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: queryResult.hasNextPage ? flatData.length + 1 : flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    horizontal: direction === "horizontal",
    gap,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll: fetch more when approaching bottom
  React.useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (direction === "horizontal") {
        const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
        const distanceFromEnd = scrollWidth - scrollLeft - clientWidth;

        if (
          distanceFromEnd < scrollThreshold &&
          queryResult.hasNextPage &&
          !queryResult.isFetchingNextPage
        ) {
          queryResult.fetchNextPage();
        }
      } else {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        if (
          distanceFromBottom < scrollThreshold &&
          queryResult.hasNextPage &&
          !queryResult.isFetchingNextPage
        ) {
          queryResult.fetchNextPage();
        }
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [
    queryResult.hasNextPage,
    queryResult.isFetchingNextPage,
    queryResult.fetchNextPage,
    scrollThreshold,
    direction,
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
        <div
          className={cn(
            "flex items-center justify-center text-muted-foreground",
            className,
          )}
          style={{ height }}
        >
          <p>No data available</p>
        </div>
      )
    );
  }

  const totalSize = virtualizer.getTotalSize();
  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      <div
        className="relative"
        style={{
          height: isHorizontal ? "100%" : `${totalSize}px`,
          width: isHorizontal ? `${totalSize}px` : "100%",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index >= flatData.length;
          const item = flatData[virtualItem.index] as TData | undefined;
          const key =
            getItemKey && item
              ? getItemKey(item, virtualItem.index)
              : virtualItem.key;

          return (
            <div
              key={key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className={cn(
                "absolute top-0 left-0",
                isHorizontal ? "h-full" : "w-full",
              )}
              style={{
                width: isHorizontal ? `${virtualItem.size}px` : undefined,
                height: isHorizontal ? undefined : `${virtualItem.size}px`,
                transform: isHorizontal
                  ? `translateX(${virtualItem.start}px)`
                  : `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow || !item
                ? queryResult.hasNextPage
                  ? (loadingMoreComponent ?? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      </div>
                    ))
                  : (endComponent ?? null)
                : renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Grid variant for card layouts
interface InfiniteScrollGridProps<TData> extends Omit<
  InfiniteScrollListProps<TData>,
  "direction" | "estimateSize"
> {
  /**
   * Number of columns in the grid
   * @default 1
   */
  columns?: number;
  /**
   * Estimated height of each row in pixels
   */
  estimateRowHeight: number;
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
        <div
          className={cn(
            "flex items-center justify-center text-muted-foreground",
            className,
          )}
          style={{ height }}
        >
          <p>No data available</p>
        </div>
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
