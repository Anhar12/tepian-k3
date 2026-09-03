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
import { globalErrorToast } from "@/lib/toast";

import type { DraftOrderItem } from "@/stores/pengujian-order-cart.store";

import { authMeQueryOptions } from "@/utils/auth-query";
import { trpc } from "@/utils/trpc";

import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Globe2,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

interface ParameterSelectionProps {
  companyId?: string;
  activeLocationId?: string;
  activeLocationName?: string;
  onAddItems: (items: DraftOrderItem[]) => void;
  isCartOpen: boolean;
  onToggleCart: () => void;
}

type PengujianSearch = {
  clusterId?: string;
  parameterCategoryId?: string;
  page?: number;
  perPage?: number;
  name?: string;
};

const routeApi = getRouteApi("/(core)/pengujian/");

const ALL_CATEGORY_VALUE = "__all_category__";

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

const clusterTextColorMap: Record<string, string> = {
  biomarker: "text-rose-500",
  "kesehatan kerja": "text-amber-500",
  "keselamatan kerja": "text-violet-500",
  "lingkungan hidup": "text-blue-500",
  "lingkungan kerja": "text-emerald-500",
};

const getClusterTextColor = (clusterName?: string) => {
  return (
    clusterTextColorMap[clusterName?.trim().toLowerCase() ?? ""] ??
    "text-slate-500"
  );
};

export function ParameterSelection({
  companyId,
  activeLocationId,
  activeLocationName,
  onAddItems,
  isCartOpen,
  onToggleCart,
}: ParameterSelectionProps) {
  const navigate = routeApi.useNavigate();

  const search = routeApi.useSearch() as PengujianSearch;

  const [searchTerm, setSearchTerm] = useState(search.name ?? "");

  const debouncedSearch = useDebounced(searchTerm, 500);

  const [cart, setCart] = useState<
    Map<
      string,
      {
        quantity: number;
        price: number;
        parameterName: string;
        clusterName: string;
        categoryName: string;
      }
    >
  >(new Map());

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
        perPage: search.perPage ?? 10,
        name: search.name,
      },
      {
        enabled: true,
      },
    ),
  );

  const updateSearch = useCallback(
    (values: Partial<PengujianSearch>) => {
      navigate({
        to: "/pengujian",
        search: (old) => ({
          ...old,
          ...values,
        }),
        resetScroll: false,
      });
    },
    [navigate],
  );

  useEffect(() => {
    updateSearch({
      name: debouncedSearch || undefined,
      page: 1,
    });
  }, [debouncedSearch, updateSearch]);

  const chooseCluster = (clusterId: string) => {
    updateSearch({
      clusterId,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const showAllParameters = () => {
    updateSearch({
      clusterId: undefined,
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const chooseCategory = (value: string) => {
    updateSearch({
      parameterCategoryId: value === ALL_CATEGORY_VALUE ? undefined : value,
      page: 1,
    });
  };

  const resetCategory = () => {
    updateSearch({
      parameterCategoryId: undefined,
      page: 1,
    });
  };

  const currentPage = search.page ?? 1;

  const perPage = search.perPage ?? 10;

  const selectedParameterCount = cart.size;

  const selectedServiceCount = useMemo(
    () =>
      Array.from(cart.values()).reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [cart],
  );

  const handleAddAllToCart = () => {
    if (!me) {
      globalErrorToast("Anda harus login terlebih dahulu");
      return;
    }

    if (!companyId) {
      globalErrorToast("Perusahaan harus dipilih terlebih dahulu");
      return;
    }

    if (!activeLocationId) {
      globalErrorToast("Lokasi harus dipilih terlebih dahulu");
      return;
    }

    if (cart.size === 0) {
      globalErrorToast("Belum ada parameter yang dipilih");
      return;
    }

    onAddItems(
      Array.from(cart, ([parameterId, item]) => ({
        parameterId,
        parameterName: item.parameterName,
        clusterName: item.clusterName,
        categoryName: item.categoryName,
        locationId: activeLocationId,
        locationName: activeLocationName ?? "Lokasi pengujian",
        quantity: item.quantity,
        price: item.price,
      })),
    );

    setCart(new Map());
  };

  return (
    <section className="space-y-3" aria-label="Pemilihan parameter pengujian">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Daftar Jenis Pengujian
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Pilih parameter dan jumlah layanan untuk lokasi aktif.
          </p>
        </div>
        {!isCartOpen && (
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl text-primary hover:bg-blue-50"
            aria-label="Buka keranjang"
            title="Buka keranjang"
            onClick={onToggleCart}
          >
            <ShoppingCart className="size-4" />
          </Button>
        )}
      </div>

      {/* Cluster Tabs */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto px-2 py-2">
          <button
            type="button"
            onClick={showAllParameters}
            className={`flex h-8 min-w-27.5 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-bold uppercase transition-colors ${
              !search.clusterId
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Globe2 className="size-3.5" />
            Semua
          </button>

          {loadingClusters
            ? Array.from({
                length: 5,
              }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="mx-1 h-8 min-w-32.5 rounded-full"
                />
              ))
            : clusters?.map((cluster, index) => {
                const Icon = getClusterIcon(cluster.name) ?? Globe2;

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => chooseCluster(cluster.id)}
                    className={`flex h-8 min-w-32.5 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-bold uppercase transition-colors ${
                      search.clusterId === cluster.id
                        ? clusterActive[index % clusterColors.length]
                        : "hover:bg-slate-50"
                    } ${clusterColors[index % clusterColors.length]}`}
                  >
                    <Icon className="size-3.5" />

                    {cluster.name}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-62.5">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari Pengujian..."
              className="h-9 rounded-lg border-slate-200 pl-9 text-xs shadow-none"
            />
          </div>

          {/* Category */}
          {loadingCategories ? (
            <Skeleton className="h-9 w-48 rounded-lg" />
          ) : (
            <div className="relative w-48 shrink-0">
              <Select
                value={search.parameterCategoryId ?? ALL_CATEGORY_VALUE}
                onValueChange={chooseCategory}
              >
                <SelectTrigger
                  className={`h-9 w-full rounded-lg border-slate-200 bg-white text-xs shadow-none ${
                    search.parameterCategoryId
                  }`}
                >
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={ALL_CATEGORY_VALUE}>
                    Semua Kategori
                  </SelectItem>

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
                  aria-label="Reset kategori"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    resetCategory();
                  }}
                  className="absolute top-1/2 right-8 z-20 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-230 border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-slate-100">
                <th className="rounded-l-full px-4 py-2.5 text-[13px] font-bold text-slate-700">
                  Jenis Pengujian
                </th>

                <th className="px-4 py-2.5 text-[13px] font-bold text-slate-700">
                  Kategori
                </th>

                <th className="px-4 py-2.5 text-[13px] font-bold text-slate-700">
                  Parameter
                </th>

                <th className="px-4 py-2.5 text-[13px] font-bold text-slate-700">
                  Acuan Standar
                </th>

                <th className="px-4 py-2.5 text-[13px] font-bold text-slate-700">
                  Biaya
                </th>

                <th className="rounded-r-full px-4 py-2.5 text-center text-[13px] font-bold text-slate-700">
                  Jumlah
                </th>
              </tr>
            </thead>

            <tbody>
              {loadingParameters
                ? Array.from({
                    length: 10,
                  }).map((_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={6}
                        className="border-b border-slate-100 px-4 py-3"
                      >
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : parameters?.data.map((row) => {
                    const quantity = cart.get(row.id)?.quantity ?? 0;

                    const clusterName =
                      (
                        row as typeof row & {
                          cluster?: {
                            name?: string;
                          };
                        }
                      ).cluster?.name ?? "-";

                    const clusterTextColor = getClusterTextColor(clusterName);

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 text-xs last:border-b-0"
                      >
                        <td className="border-b border-slate-100 px-4 py-2.5">
                          <span
                            className={`text-[10px] font-bold uppercase ${clusterTextColor}`}
                          >
                            {clusterName}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-2.5">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">
                            {row.category.name}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-2.5">
                          <span className="font-semibold text-blue-500">
                            {row.name}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-2.5 text-slate-500">
                          {row.reference ?? "-"}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-2.5 whitespace-nowrap text-slate-600">
                          Rp {row.price.toLocaleString("id-ID")}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-2">
                          <div className="flex justify-center">
                            <div className="flex h-7 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-none text-xs"
                                onClick={() =>
                                  setCart((oldCart) => {
                                    const next = new Map(oldCart);
                                    if (quantity <= 1) next.delete(row.id);
                                    else
                                      next.set(row.id, {
                                        quantity: quantity - 1,
                                        price: row.price,
                                        parameterName: row.name,
                                        clusterName: row.cluster.name,
                                        categoryName: row.category.name,
                                      });
                                    return next;
                                  })
                                }
                              >
                                −
                              </Button>
                              <span className="flex w-7 items-center justify-center border-x border-slate-200 text-[11px] font-semibold text-slate-700">
                                {quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-none text-xs"
                                onClick={() =>
                                  setCart((oldCart) => {
                                    const next = new Map(oldCart);
                                    next.set(row.id, {
                                      quantity: quantity + 1,
                                      price: row.price,
                                      parameterName: row.name,
                                      clusterName: row.cluster.name,
                                      categoryName: row.category.name,
                                    });
                                    return next;
                                  })
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loadingParameters && parameters?.data.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            Parameter tidak ditemukan.
          </div>
        )}

        {/* Pagination */}
        <div className="mt-3 flex flex-col gap-3 px-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            Menampilkan {parameters?.data.length ?? 0} dari{" "}
            {parameters?.total ?? 0} data
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-800">
            <div className="flex items-center gap-2">
              <span>Baris per halaman</span>

              <Select
                value={String(perPage)}
                onValueChange={(value) =>
                  updateSearch({
                    perPage: Number(value),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 text-xs">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="10">10</SelectItem>

                  <SelectItem value="20">20</SelectItem>

                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span>
              Halaman {currentPage} dari {parameters?.pageCount ?? 1}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                disabled={currentPage === 1 || loadingParameters}
                onClick={() =>
                  updateSearch({
                    page: currentPage - 1,
                  })
                }
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                disabled={
                  loadingParameters ||
                  currentPage === (parameters?.pageCount ?? 1)
                }
                onClick={() =>
                  updateSearch({
                    page: currentPage + 1,
                  })
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cart Action */}
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <ClipboardList className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800">
                {selectedParameterCount} layanan dipilih
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Parameter akan ditambahkan ke keranjang untuk lokasi aktif.
              </p>
            </div>
          </div>

          <Button
            className="h-9 shrink-0 gap-2 px-4 text-xs"
            disabled={!me || !companyId || !activeLocationId || cart.size === 0}
            onClick={handleAddAllToCart}
          >
            <ShoppingCart className="size-3.5" />
            Tambahkan ke Keranjang
          </Button>
        </div>

        {/* Supaya quantity total tetap dipakai dan tidak hilang
				    jika nanti ingin ditampilkan */}
        <span className="hidden">{selectedServiceCount}</span>
      </div>
    </section>
  );
}
