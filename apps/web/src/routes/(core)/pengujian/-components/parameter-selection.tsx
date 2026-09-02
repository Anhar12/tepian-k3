import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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

import { authMeQueryOptions } from "@/utils/auth-query";
import { trpc } from "@/utils/trpc";
import type { DraftOrderItem } from "@/stores/pengujian-order-cart.store";

import { useQuery } from "@tanstack/react-query";

import { getRouteApi } from "@tanstack/react-router";

import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import { createElement, useCallback, useEffect, useState } from "react";

interface ParameterSelectionProps {
  companyId?: string;
  activeLocationId?: string;
  activeLocationName?: string;
  onAddItems: (items: DraftOrderItem[]) => void;
}

type PengujianSearch = {
  clusterId?: string;
  parameterCategoryId?: string;
  page?: number;
  perPage?: number;
  name?: string;
};

const routeApi = getRouteApi("/(core)/pengujian/");

const clusterColors = [
  "text-rose-500",
  "text-amber-500",
  "text-violet-500",
  "text-blue-500",
  "text-emerald-500",
];

export function ParameterSelection({
  companyId,
  activeLocationId,
  activeLocationName,
  onAddItems,
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
        enabled: Boolean(search.clusterId),
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

  useEffect(() => {
    setCart(new Map());
  }, [activeLocationId]);

  const chooseCluster = (clusterId: string) => {
    setCart(new Map());

    updateSearch({
      clusterId,
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

  const currentPage = search.page ?? 1;

  const selectedServiceCount = Array.from(cart.values()).reduce(
    (total, item) => total + item.quantity,
    0,
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
        parameterName:
          parameters?.data.find((parameter) => parameter.id === parameterId)
            ?.name ?? "Parameter pengujian",
        categoryName:
          parameters?.data.find((parameter) => parameter.id === parameterId)
            ?.category.name ?? "-",
        locationId: activeLocationId,
        locationName: activeLocationName ?? "Lokasi pengujian",
        quantity: item.quantity,
        price: item.price,
      })),
    );
    setCart(new Map());
  };

  return (
    <section
      className="grid items-start gap-3"
      aria-label="Pemilihan parameter pengujian"
    >
      {/* Main Content */}
      <div className="min-w-0 space-y-4">
        {/* Header */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">
            Daftar Jenis Pengujian
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Pilih parameter dan jumlah layanan untuk lokasi aktif.
          </p>
        </div>

        {/* Cluster Selector */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-3xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
          {loadingClusters
            ? Array.from({
                length: 5,
              }).map((_, index) => (
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

        {/* Parameter Table */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex justify-between space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-500" />

              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari Parameter..."
                className="h-10 rounded-lg border-slate-200 pl-10"
              />
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
                  <SelectTrigger className="h-10! w-full rounded-lg border-slate-200 pr-4">
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

          {!search.clusterId ? (
            <div className="flex min-h-96 items-center justify-center text-center text-sm text-slate-400">
              Pilih jenis pengujian untuk melihat daftar parameter.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-225 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-sm font-bold text-slate-800">
                      <th className="rounded-l-full px-5 py-4">
                        Kategori Parameter
                      </th>

                      <th className="px-5 py-4">Parameter</th>

                      <th className="px-5 py-4">Acuan Standar</th>

                      <th className="px-5 py-4">Biaya</th>

                      <th className="px-5 py-4">Jumlah</th>

                      <th className="rounded-r-full px-5 py-4">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingParameters
                      ? Array.from({
                          length: 8,
                        }).map((_, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td colSpan={6} className="px-5 py-4">
                              <Skeleton className="h-5 w-full" />
                            </td>
                          </tr>
                        ))
                      : parameters?.data.map((row) => {
                          const quantity = cart.get(row.id)?.quantity ?? 0;

                          const subtotal = quantity * row.price;

                          return (
                            <tr
                              key={row.id}
                              className="border-b border-slate-100 text-slate-600"
                            >
                              <td className="px-5 py-3">{row.category.name}</td>

                              <td className="px-5 py-3">
                                <span className="font-medium text-blue-500">
                                  {row.name}
                                </span>
                              </td>

                              <td className="px-5 py-3">
                                {row.reference ?? "-"}
                              </td>

                              <td className="px-5 py-3 whitespace-nowrap">
                                Rp {row.price.toLocaleString("id-ID")}
                              </td>

                              <td className="px-5 py-3">
                                <NumberInput
                                  value={quantity}
                                  min={0}
                                  className="h-9 w-16 rounded-lg text-center"
                                  onChange={(value) => {
                                    setCart((oldCart) => {
                                      const next = new Map(oldCart);

                                      if (value <= 0) {
                                        next.delete(row.id);
                                      } else {
                                        next.set(row.id, {
                                          quantity: value,
                                          price: row.price,
                                        });
                                      }

                                      return next;
                                    });
                                  }}
                                />
                              </td>

                              <td className="px-5 py-3 font-semibold whitespace-nowrap text-primary">
                                Rp {subtotal.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {/* Empty Result */}
              {!loadingParameters && parameters?.data.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  Parameter tidak ditemukan.
                </div>
              )}

              {/* Pagination */}
              {parameters?.pageCount && parameters.pageCount > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1 || loadingParameters}
                    onClick={() =>
                      updateSearch({
                        page: currentPage - 1,
                      })
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <Badge className="flex h-8 min-w-8 items-center justify-center bg-slate-800">
                    {currentPage}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={
                      !parameters.pageCount ||
                      currentPage === parameters.pageCount ||
                      loadingParameters
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
              )}

              {/* Cart Action */}
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-800">
                    {selectedServiceCount} layanan dipilih
                  </p>

                  <p className="text-sm text-slate-500">
                    Parameter akan ditambahkan ke keranjang untuk lokasi aktif.
                  </p>
                </div>

                <Button
                  className="gap-2"
                  disabled={
                    !me ||
                    !companyId ||
                    !activeLocationId ||
                    cart.size === 0 ||
                    false
                  }
                  onClick={handleAddAllToCart}
                >
                  <ShoppingCart className="size-4" />
                  Tambahkan ke Keranjang
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
