import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type {
  ExtendedColumnFilter,
  JoinOperator,
} from "@tepian-k3/types/data-table.types";

const DEBOUNCE_MS = 500;

interface CursorPaginationResult<TData> {
  data: TData[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface SearchParams {
  sort: { id: string; desc: boolean };
  filters?: {
    id: string;
    value: string | string[];
    variant: string;
    operator: string;
    filterId: string;
  }[];
  joinOperator?: string;
  [key: string]: unknown;
}

interface UseCursorInfiniteScrollProps<TData, TSearch extends SearchParams> {
  /**
   * The infinite query result from tRPC useInfiniteQuery
   */
  queryResult: {
    data:
      | {
          pages: CursorPaginationResult<TData>[];
          pageParams: (string | undefined)[];
        }
      | undefined;
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    refetch: () => void;
  };
  search: TSearch;
  navigate: (opts: { search: (prev: TSearch) => TSearch }) => void;
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
  debounceMs?: number;
  enableAdvancedFilter?: boolean;
}

export function useCursorInfiniteScroll<TData, TSearch extends SearchParams>(
  props: UseCursorInfiniteScrollProps<TData, TSearch>,
) {
  const {
    queryResult,
    search,
    navigate,
    estimateSize,
    overscan = 5,
    scrollThreshold = 500,
    debounceMs = DEBOUNCE_MS,
    enableAdvancedFilter = false,
  } = props;

  // Ref for the scrollable container
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
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll: fetch more when approaching bottom
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- using specific queryResult properties intentionally to avoid re-running on every render
  }, [
    queryResult.hasNextPage,
    queryResult.isFetchingNextPage,
    queryResult.fetchNextPage,
    scrollThreshold,
  ]);

  // Sorting — derived from search params
  const sort = search.sort;

  const setSort = React.useCallback(
    (value: { id: string; desc: boolean }) => {
      navigate({
        search: (prev) => ({
          ...prev,
          sort: value,
        }),
      });
    },
    [navigate],
  );

  // Advanced filters — derived from search params, updated via navigate
  const filters = React.useMemo(
    () => (search.filters ?? []) as ExtendedColumnFilter<TData>[],
    [search.filters],
  );

  const debouncedNavigateAdvancedFilters = useDebouncedCallback(
    (newFilters: ExtendedColumnFilter<TData>[] | null) => {
      navigate({
        search: (prev) => ({
          ...prev,
          filters: newFilters ?? [],
        }),
      });
    },
    debounceMs,
  );

  const setFilters = React.useCallback(
    (
      value:
        | ExtendedColumnFilter<TData>[]
        | ((
            prev: ExtendedColumnFilter<TData>[],
          ) => ExtendedColumnFilter<TData>[])
        | null,
    ) => {
      if (typeof value === "function") {
        debouncedNavigateAdvancedFilters(value(filters));
      } else {
        debouncedNavigateAdvancedFilters(value);
      }
    },
    [filters, debouncedNavigateAdvancedFilters],
  );

  const joinOperator = (search.joinOperator ?? "and") as JoinOperator;

  const setJoinOperator = React.useCallback(
    (value: JoinOperator) => {
      navigate({
        search: (prev) => ({
          ...prev,
          joinOperator: value,
        }),
      });
    },
    [navigate],
  );

  return {
    // Refs
    parentRef,
    // Virtualizer
    virtualizer,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
    // Data
    flatData,
    totalFetched: flatData.length,
    // Query state
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    refetch: queryResult.refetch,
    // Sorting & Filtering
    sort,
    setSort,
    filters: enableAdvancedFilter ? filters : [],
    setFilters,
    joinOperator,
    setJoinOperator,
  };
}
