import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import useDebounced from "@/hooks/use-debounced";

import { getClusterIcon } from "@/lib/cluster-colors";

import { trpc } from "@/utils/trpc";

import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState } from "react";

type CatalogSearch = {
  clusterId?: string;
  parameterCategoryId?: string;
  page?: number;
  perPage?: number;
  name?: string;
  companyId?: string;
  locationId?: string;
};

const clusterColors = [
  "text-rose-500",
  "text-amber-500",
  "text-violet-500",
  "text-blue-500",
  "text-emerald-500",
];

const clusterActive = [
  "bg-rose-500/10",
  "bg-amber-500/10",
  "bg-violet-500/10",
  "bg-blue-500/10",
  "bg-emerald-500/10",
];

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

export function KatalogBrowser() {
  const navigate = useNavigate();

  const search = useSearch({
    strict: false,
  }) as CatalogSearch;

  const [searchTerm, setSearchTerm] = useState(search.name ?? "");

  const debouncedSearch = useDebounced(searchTerm, 500);

  const currentPage = search.page ?? 1;
  const perPage = search.perPage ?? 10;

  const { data: clusters, isLoading: loadingClusters } = useQuery(
    trpc.pengujian.cluster.getAllClusters.queryOptions(),
  );

  const { data: categories, isLoading: loadingCategories } = useQuery(
    trpc.pengujian.parameterCategories.getAllParameterCategories.queryOptions(),
  );

  const { data: parameters, isLoading: loadingParameters } = useQuery(
    trpc.pengujian.parameter.getOffsetPaginatedParametersByClusterIdAndCategoryId.queryOptions(
      {
        clusterId: search.clusterId,
        parameterCategoryId: search.parameterCategoryId,
        page: currentPage,
        perPage,
        name: search.name,
      },
    ),
  );

  useEffect(() => {
    navigate({
      to: "/katalog",
      search: (old) => ({
        ...old,
        name: debouncedSearch || undefined,
        page: 1,
      }),
      resetScroll: false,
    });
  }, [debouncedSearch, navigate]);

  const updateSearch = (values: Partial<CatalogSearch>) => {
    navigate({
      to: "/katalog",
      search: (old) => ({
        ...old,
        ...values,
      }),
      resetScroll: false,
    });
  };

  const chooseCluster = (clusterId: string) => {
    updateSearch({
      clusterId,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const resetCluster = () => {
    updateSearch({
      clusterId: undefined,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const resetCategory = () => {
    updateSearch({
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const pageCount = parameters?.pageCount ?? 1;

  const totalData = useMemo(() => {
    if (!parameters) return 0;

    return parameters.data.length;
  }, [parameters]);

  const showingFrom = totalData === 0 ? 0 : (currentPage - 1) * perPage + 1;

  const showingTo = Math.min(currentPage * perPage, totalData);

  const paginationItems = useMemo(() => {
    if (pageCount <= 1) return [1];

    const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [];

    if (pageCount <= 7) {
      for (let page = 1; page <= pageCount; page++) {
        pages.push(page);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("ellipsis-left");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(pageCount - 1, currentPage + 1);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    if (currentPage < pageCount - 3) {
      pages.push("ellipsis-right");
    }

    pages.push(pageCount);

    return pages;
  }, [currentPage, pageCount]);

  return (
    <section
      className="mt-16 grid items-start gap-3 lg:grid-cols-[325px_minmax(0,1fr)]"
      aria-label="Katalog pengujian"
    >
      <aside className="min-h-156.25 rounded-3xl border bg-white p-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
        <h2 className="mb-6 text-2xl font-bold text-slate-800">Filter</h2>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500" />

            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari Pengujian..."
              className="h-10 rounded-lg border-slate-200 pl-10"
            />
          </div>

          {/* Jenis Pengujian */}
          <div className="relative">
            <Select
              value={search.clusterId ?? ""}
              onValueChange={chooseCluster}
            >
              <SelectTrigger className="h-10! w-full rounded-lg border-slate-200">
                <SelectValue placeholder="Semua Jenis Pengujian" />
              </SelectTrigger>

              <SelectContent>
                {clusters?.map((cluster) => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {search.clusterId && (
              <button
                type="button"
                aria-label="Reset jenis pengujian"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  resetCluster();
                }}
                className="absolute top-1/2 right-9 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Kategori Parameter */}
          {loadingCategories ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <div className="relative">
              <Select
                value={search.parameterCategoryId ?? ""}
                onValueChange={(value) =>
                  updateSearch({
                    parameterCategoryId: value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="h-10! w-full rounded-lg border-slate-200">
                  <SelectValue placeholder="Semua Kategori Parameter" />
                </SelectTrigger>

                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {search.parameterCategoryId && (
                <button
                  type="button"
                  aria-label="Reset kategori parameter"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    resetCategory();
                  }}
                  className="absolute top-1/2 right-9 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-3">
        {/* Header */}
        <div className="rounded-3xl border bg-white px-8 py-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
          <h2 className="text-2xl font-bold text-slate-800">
            Daftar Parameter Pengujian
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Lihat dan pilih parameter serta biaya pengujian
          </p>
        </div>

        {/* Cluster */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-3xl border bg-white px-3 py-3 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
          <button
            type="button"
            onClick={resetCluster}
            className={`flex min-w-32 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-bold uppercase transition-colors ${
              !search.clusterId
                ? "bg-slate-100 text-slate-800"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Globe2 className="size-5" />
            Semua
          </button>

          {loadingClusters
            ? Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 min-w-28 rounded-xl" />
              ))
            : clusters?.map((cluster, index) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => chooseCluster(cluster.id)}
                  className={`flex min-w-32 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-bold uppercase transition-colors ${
                    search.clusterId === cluster.id
                      ? clusterActive[index % clusterColors.length]
                      : "hover:bg-slate-50"
                  } ${clusterColors[index % clusterColors.length]}`}
                >
                  {createElement(getClusterIcon(cluster.name) || Globe2, {
                    className: "size-5",
                  })}

                  {cluster.name}
                </button>
              ))}
        </div>

        {/* Table */}
        <div className="rounded-3xl border bg-white p-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-sm font-bold text-slate-800">
                  <th className="min-w-48 rounded-l-full px-5 py-4">
                    Kategori Parameter
                  </th>

                  <th className="px-5 py-4">Parameter</th>

                  <th className="min-w-40 px-5 py-4">Acuan Standar</th>

                  <th className="px-5 py-4">Biaya</th>

                  <th className="rounded-r-full px-5 py-4" />
                </tr>
              </thead>

              <tbody>
                {loadingParameters ? (
                  Array.from({ length: perPage }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td colSpan={5} className="px-5 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                ) : parameters?.data?.length ? (
                  parameters.data.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 text-slate-600"
                    >
                      <td className="px-5 py-2">{row.category.name}</td>

                      <td className="px-5 py-2 font-medium text-blue-500">
                        {row.name}
                      </td>

                      <td className="px-5 py-2">{row.reference ?? "-"}</td>

                      <td className="px-5 py-2 whitespace-nowrap">
                        Rp {row.price.toLocaleString("id-ID")}
                      </td>

                      <td className="px-5 py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Tambahkan ${row.name} ke keranjang`}
                          onClick={() =>
                            navigate({
                              to: "/pengujian",
                            })
                          }
                        >
                          <ShoppingCart className="size-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Parameter tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loadingParameters && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 lg:flex-row">
              {/* Showing data */}
              <div className="text-xs text-slate-500">
                Menampilkan{" "}
                <span className="font-semibold text-slate-700">
                  {showingFrom}-{showingTo}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-700">
                  {totalData}
                </span>{" "}
                data
              </div>

              <div className="flex items-center gap-3">
                {/* Per Page */}
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Select
                    value={String(perPage)}
                    onValueChange={(value) =>
                      updateSearch({
                        perPage: Number(value),
                        page: 1,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 w-16 rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page info */}
                <span className="hidden text-sm font-medium whitespace-nowrap text-slate-700 xl:inline">
                  Halaman {currentPage} dari {pageCount}
                </span>

                {/* Previous */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Halaman sebelumnya"
                  disabled={currentPage === 1}
                  onClick={() =>
                    updateSearch({
                      page: currentPage - 1,
                    })
                  }
                  className="rounded-xl"
                >
                  <ChevronLeft className="size-5" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {paginationItems.map((item, index) => {
                    if (item === "ellipsis-left" || item === "ellipsis-right") {
                      return (
                        <span
                          key={`${item}-${index}`}
                          className="flex size-10 items-center justify-center text-slate-400"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={item}
                        variant={currentPage === item ? "default" : "ghost"}
                        size="icon"
                        aria-label={`Halaman ${item}`}
                        onClick={() =>
                          updateSearch({
                            page: item,
                          })
                        }
                        className={`rounded-xl ${
                          currentPage === item
                            ? "bg-slate-800 text-white hover:bg-slate-700"
                            : ""
                        }`}
                      >
                        {item}
                      </Button>
                    );
                  })}
                </div>

                {/* Next */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Halaman berikutnya"
                  disabled={!parameters?.pageCount || currentPage >= pageCount}
                  onClick={() =>
                    updateSearch({
                      page: currentPage + 1,
                    })
                  }
                  className="rounded-xl"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
