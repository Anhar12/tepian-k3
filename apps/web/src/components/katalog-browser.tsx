import { Badge } from "@/components/ui/badge";
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

import { authMeQueryOptions } from "@/utils/auth-query";
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
import { createElement, useEffect, useState } from "react";

type CatalogSearch = {
  clusterId?: string;
  parameterCategoryId?: string;
  page?: number;
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

export function KatalogBrowser() {
  const navigate = useNavigate();

  const search = useSearch({
    strict: false,
  }) as CatalogSearch;

  const [searchTerm, setSearchTerm] = useState(search.name ?? "");

  const debouncedSearch = useDebounced(searchTerm, 500);

  const [cart, setCart] = useState<
    Map<string, { quantity: number; price: number }>
  >(new Map());

  const [adding, setAdding] = useState<string | null>(null);

  const { data: me } = useQuery(authMeQueryOptions());

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
        page: search.page ?? 1,
        perPage: 8,
        name: search.name,
      },
      {
        enabled: Boolean(search.clusterId),
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

  const updateSearch = (values: Partial<CatalogSearch>) =>
    navigate({
      to: "/katalog",
      search: (old) => ({
        ...old,
        ...values,
      }),
      resetScroll: false,
    });

  const chooseCluster = (clusterId: string) => {
    setCart(new Map());

    updateSearch({
      clusterId,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const resetCluster = () => {
    setCart(new Map());

    updateSearch({
      clusterId: undefined,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  return (
    <section
      className="mt-16 grid items-start gap-3 lg:grid-cols-[325px_minmax(0,1fr)]"
      aria-label="Katalog pengujian"
    >
      <aside className="min-h-156.25 rounded-3xl border bg-white p-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
        <h2 className="mb-6 text-2xl font-bold text-slate-800">Filter</h2>

        <div className="space-y-3">
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
              onValueChange={(value) => chooseCluster(value)}
            >
              <SelectTrigger className="h-10! w-full rounded-lg border-slate-200">
                <SelectValue placeholder="Jenis Pengujian" />
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
                  <SelectValue placeholder="Kategori Parameter" />
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

                    updateSearch({
                      parameterCategoryId: undefined,
                      page: 1,
                    });
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
        <div className="rounded-3xl border bg-white px-8 py-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
          <h2 className="text-2xl font-bold text-slate-800">
            Daftar Jenis Pengujian
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Kelola parameter dan biaya pengujian
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-3xl border bg-white px-3 py-3 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
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
                      ? "bg-slate-100"
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

        <div className="rounded-3xl border bg-white p-8 shadow-[0_14px_40px_-30px_rgba(16,97,214,0.35)]">
          {!search.clusterId ? (
            <div className="flex min-h-96 items-center justify-center text-center text-sm text-slate-400">
              Pilih klaster pengujian untuk melihat daftar parameter.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-170 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-sm font-bold text-slate-800">
                      <th className="rounded-l-full px-5 py-4">
                        Kategori Parameter
                      </th>

                      <th className="px-5 py-4">Parameter</th>

                      <th className="px-5 py-4">Acuan Standar</th>

                      <th className="px-5 py-4">Biaya</th>

                      <th className="rounded-r-full px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {loadingParameters
                      ? Array.from({ length: 8 }).map((_, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td colSpan={5} className="px-5 py-4">
                              <Skeleton className="h-5 w-full" />
                            </td>
                          </tr>
                        ))
                      : parameters?.data.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-slate-100 text-slate-600"
                          >
                            <td className="px-5 py-3">{row.category.name}</td>

                            <td className="px-5 py-3 font-medium text-blue-500">
                              {row.name}
                            </td>

                            <td className="px-5 py-3">
                              {row.reference ?? "-"}
                            </td>

                            <td className="px-5 py-3 whitespace-nowrap">
                              Rp {row.price.toLocaleString("id-ID")}
                            </td>

                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Tambahkan ${row.name} ke keranjang`}
                                  disabled={adding === row.id}
                                  onClick={() =>
                                    navigate({
                                      to: "/pengujian",
                                    })
                                  }
                                >
                                  <ShoppingCart className="size-4 text-slate-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={(search.page ?? 1) === 1}
                  onClick={() =>
                    updateSearch({
                      page: (search.page ?? 1) - 1,
                    })
                  }
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <Badge className="flex h-8 min-w-8 items-center justify-center bg-slate-800">
                  {search.page ?? 1}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={
                    !parameters?.pageCount ||
                    search.page === parameters.pageCount
                  }
                  onClick={() =>
                    updateSearch({
                      page: (search.page ?? 1) + 1,
                    })
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
