import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Car,
  ChevronUp,
  Loader2,
  MapPin,
  Plane,
  Plus,
  Minus,
  Ship,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/(core)/pengujian/checkout")({
  head: () => pageHead("Pengujian - Checkout"),
  component: StandaloneCheckoutPage,
});

type CheckoutItem = {
  parameterId: string;
  parameterName?: string;
  clusterName?: string;
  categoryName?: string;
  locationId?: string;
  locationName?: string;
  price: number;
  quantity: number;
};

type CheckoutContentProps = {
  companyId?: string;
  locationNames?: Record<string, string>;
  items?: CheckoutItem[];

  increment?: (parameterId: string, locationId?: string) => void;

  decrement?: (parameterId: string, locationId?: string) => void;

  remove?: (parameterId: string, locationId?: string) => void;
};

const autoItems = [
  {
    id: "uang-harian",
    label: "Uang Harian",
    description:
      "Uang Harian petugas selama pengujian berlangsung mengacu SBM yang berlaku",
    icon: Wallet,
  },
  {
    id: "operasional",
    label: "Operasional Lapangan",
    description:
      "Biaya operasional di lokasi seperti transportasi lokal dan logistik",
    icon: BriefcaseBusiness,
  },
];

const optionalItems = [
  {
    id: "udara",
    label: "Transportasi Udara (PP)",
    icon: Plane,
  },
  {
    id: "darat",
    label: "Transportasi Darat",
    icon: Car,
  },
  {
    id: "laut",
    label: "Transportasi Laut/Sungai (PP)",
    icon: Ship,
  },
  {
    id: "bagasi-pesawat",
    label: "Bagasi Pesawat (PP)",
    icon: Plane,
  },
  {
    id: "darat-bandara",
    label: "Transportasi Darat menuju Bandara/Pelabuhan (PP)",
    icon: Car,
  },
];

const clusterColorMap: Record<string, string> = {
  biomarker: "text-rose-500",
  biomaker: "text-rose-500",

  "kesehatan kerja": "text-amber-500",

  "keselamatan kerja": "text-violet-500",

  "lingkungan hidup": "text-blue-500",

  "lingkungan kerja": "text-emerald-500",
};

function getClusterColor(clusterName?: string) {
  if (!clusterName) {
    return "text-slate-700";
  }

  const normalizedClusterName = clusterName.trim().toLowerCase();

  return clusterColorMap[normalizedClusterName] ?? "text-slate-700";
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function StandaloneCheckoutPage() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-800">Checkout Pengujian</h1>

        <p className="mt-2 text-sm text-slate-500">
          Halaman checkout digunakan melalui proses Order Pengujian.
        </p>
      </div>
    </div>
  );
}

export function CheckoutContent({
  companyId,
  locationNames = {},
  items = [],
  increment,
  decrement,
  remove,
}: CheckoutContentProps) {
  const navigate = useNavigate();

  const [optionalSelections, setOptionalSelections] = useState<Set<string>>(
    new Set(),
  );

  const [fundingType, setFundingType] = useState<"pnbp" | "dipa">("pnbp");

  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const groupedLocations = useMemo(() => {
    const grouped = new Map<
      string,
      {
        locationId: string;
        locationName: string;
        items: CheckoutItem[];
        total: number;
      }
    >();

    for (const item of items) {
      const locationId = item.locationId ?? "unknown";

      const locationName =
        locationNames[locationId] ?? item.locationName ?? "Lokasi Pengujian";

      const current = grouped.get(locationId);

      if (current) {
        current.items.push(item);
        current.total += item.price * item.quantity;
      } else {
        grouped.set(locationId, {
          locationId,
          locationName,
          items: [item],
          total: item.price * item.quantity,
        });
      }
    }

    return Array.from(grouped.values());
  }, [items, locationNames]);

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const toggleOptional = (id: string) => {
    setOptionalSelections((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const createOrderMutation = useMutation(
    trpc.pengujian.order.createOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getAllOrders.queryOptions({}),
        );

        globalSuccessToast("Order berhasil dibuat");

        navigate({
          to: "/pengujian/transaksi",
        });
      },

      onError: (error) => {
        globalErrorToast(`Gagal membuat order: ${error.message}`);
      },
    }),
  );

  const handleCreateOrder = () => {
    if (!companyId) {
      globalErrorToast("Data perusahaan belum tersedia.");
      return;
    }

    if (items.length === 0) {
      globalErrorToast("Keranjang parameter masih kosong.");
      return;
    }

    if (!confirmed) {
      globalErrorToast(
        "Silakan konfirmasi terlebih dahulu bahwa seluruh data pesanan sudah benar.",
      );
      return;
    }

    const orderItems = groupedLocations.map((location) => ({
      id: location.locationId,
      name: location.locationName,

      items: location.items.map((item) => ({
        id: item.parameterId,

        parameterId: item.parameterId,

        locationId: item.locationId ?? location.locationId,

        quantity: item.quantity,

        price: item.price,
      })),
    }));

    createOrderMutation.mutate({
      coverFlightIncluded: optionalSelections.has("udara"),

      coverBaggageIncluded: optionalSelections.has("bagasi-pesawat"),

      coverGroundTransportationIncluded: optionalSelections.has("darat"),

      coverGroundTransportationToAirportOrHarbour:
        optionalSelections.has("darat-bandara"),

      coverLodgingIncluded: false,

      coverWaterTransportationIncluded: optionalSelections.has("laut"),

      fundingType,

      customerNote: note,

      data: [
        {
          orderData: {
            companyId,
          },

          orderItems,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Automatic Cost Information */}
      <div className="grid gap-4 md:grid-cols-2">
        {autoItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Icon className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700">{item.label}</p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* LEFT CONTENT */}
        <div className="min-w-0 space-y-4">
          {/* LOCATION CART */}
          <div className="space-y-4">
            {groupedLocations.length > 0 ? (
              groupedLocations.map((location) => (
                <div
                  key={location.locationId}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                >
                  {/* Location Header */}
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                        <MapPin className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-800">
                          {location.locationName}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Lokasi pengujian
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-700 tabular-nums">
                        {formatCurrency(location.total)}
                      </span>

                      <ChevronUp className="size-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto px-4 py-2.5 md:block">
                    <table className="w-full min-w-175 text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left text-xs font-semibold text-slate-700">
                          <th className="rounded-l-full px-5 py-3">
                            Parameter
                          </th>

                          <th className="px-4 py-3">Kategori</th>

                          <th className="px-4 py-3">Jenis Pengujian</th>

                          <th className="px-4 py-3">Biaya</th>

                          <th className="px-4 py-3 text-center">Jumlah</th>

                          <th className="min-w-28 px-4 py-3 text-right">
                            Subtotal
                          </th>

                          <th className="w-12 rounded-r-full px-4 py-3" />
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {location.items.map((item) => {
                          const itemKey = `${item.locationId}-${item.parameterId}`;

                          return (
                            <tr
                              key={itemKey}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              {/* Parameter */}
                              <td className="px-5 py-3">
                                <span
                                  className={cn(
                                    "text-[12px] font-semibold",
                                    getClusterColor(item.clusterName),
                                  )}
                                >
                                  {item.clusterName}
                                </span>
                              </td>

                              {/* Kategori */}
                              <td className="px-4 py-3 text-[12px] font-medium text-slate-600">
                                {item.categoryName}
                              </td>

                              {/* Jenis Pengujian */}
                              <td className="px-4 py-3 text-[12px] font-medium text-slate-600">
                                {item.parameterName}
                              </td>

                              <td className="px-4 py-3 text-[12px] whitespace-nowrap text-slate-600 tabular-nums">
                                {formatCurrency(item.price)}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-center">
                                  <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 rounded-none"
                                      onClick={() =>
                                        decrement?.(
                                          item.parameterId,
                                          item.locationId,
                                        )
                                      }
                                    >
                                      <Minus className="size-3" />
                                    </Button>

                                    <span className="flex h-full w-8 items-center justify-center border-x border-slate-200 text-[12px] font-semibold tabular-nums">
                                      {item.quantity}
                                    </span>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 rounded-none"
                                      onClick={() =>
                                        increment?.(
                                          item.parameterId,
                                          item.locationId,
                                        )
                                      }
                                    >
                                      <Plus className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-right text-[12px] font-semibold text-slate-700 tabular-nums">
                                {formatCurrency(item.price * item.quantity)}
                              </td>

                              <td className="px-4 py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() =>
                                    remove?.(item.parameterId, item.locationId)
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cart */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {location.items.map((item) => (
                      <div
                        key={`${item.locationId}-${item.parameterId}`}
                        className="space-y-3 px-5 py-4"
                      >
                        <div className="flex gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-700">
                              {item.clusterName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.categoryName} · {item.parameterName}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-rose-500"
                            onClick={() =>
                              remove?.(item.parameterId, item.locationId)
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {formatCurrency(item.price)}
                          </span>

                          <div className="flex items-center gap-3">
                            <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-none"
                                onClick={() =>
                                  decrement?.(item.parameterId, item.locationId)
                                }
                              >
                                <Minus className="size-3" />
                              </Button>

                              <span className="flex w-8 justify-center text-xs font-bold">
                                {item.quantity}
                              </span>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-none"
                                onClick={() =>
                                  increment?.(item.parameterId, item.locationId)
                                }
                              >
                                <Plus className="size-3" />
                              </Button>
                            </div>

                            <span className="font-bold text-slate-700">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <ShoppingCart className="mx-auto size-10 text-slate-300" />

                <h3 className="mt-4 text-base font-bold text-slate-700">
                  Belum ada parameter
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tambahkan parameter terlebih dahulu pada langkah sebelumnya.
                </p>
              </div>
            )}
          </div>

          {/* OPERATIONAL COST */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Biaya Operasional Pengujian
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Pilih kebutuhan transportasi dan akomodasi selama pengujian
                berlangsung. Biaya akan dihitung dalam penawaran.
              </p>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-bold text-slate-700">
                Item Biaya Tagihan (Opsional)
              </p>

              <div className="flex flex-wrap gap-2">
                {optionalItems.map((item) => {
                  const Icon = item.icon;

                  const isSelected = optionalSelections.has(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleOptional(item.id)}
                      className={cn(
                        "flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-blue-50",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />

                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FUNDING */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-700">
                Jenis Pengujian (Pendanaan)
              </p>

              <RadioGroup
                value={fundingType}
                onValueChange={(value) =>
                  setFundingType(value as "pnbp" | "dipa")
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                <label
                  htmlFor="pnbp"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    fundingType === "pnbp"
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary/40",
                  )}
                >
                  <RadioGroupItem id="pnbp" value="pnbp" className="sr-only" />

                  <div>
                    <p className="font-bold">PNBP</p>

                    <p
                      className={cn(
                        "mt-1 text-xs",
                        fundingType === "pnbp"
                          ? "text-white/75"
                          : "text-slate-500",
                      )}
                    >
                      Penerimaan Negara Bukan Pajak
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="dipa"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    fundingType === "dipa"
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary/40",
                  )}
                >
                  <RadioGroupItem id="dipa" value="dipa" className="sr-only" />

                  <div>
                    <p className="font-bold">DIPA</p>

                    <p
                      className={cn(
                        "mt-1 text-xs",
                        fundingType === "dipa"
                          ? "text-white/75"
                          : "text-slate-500",
                      )}
                    >
                      Daftar Isian Pelaksanaan Anggaran
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* NOTE */}
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-slate-700">Catatan</p>

              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Tambahkan catatan atau informasi tambahan"
                className="resize-none rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="xl:sticky xl:top-4">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <ShoppingCart className="size-5" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">Keranjang</h3>

                <p className="text-xs text-slate-500">
                  Parameter yang sudah ditambahkan
                </p>
              </div>
            </div>

            <div className="overflow-y-auto">
              {groupedLocations.map((location) => (
                <div
                  key={location.locationId}
                  className="border-b border-slate-100 px-5 py-4"
                >
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    {location.locationName}
                  </p>

                  <div className="space-y-3">
                    {location.items.map((item) => (
                      <div
                        key={`${item.locationId}-${item.parameterId}`}
                        className="flex gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-700">
                            {item.clusterName}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {item.parameterName}
                          </p>

                          <p className="mt-1 text-xs font-bold text-primary tabular-nums">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <div className="flex h-7 items-center overflow-hidden rounded-lg border border-slate-200">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none"
                              onClick={() =>
                                decrement?.(item.parameterId, item.locationId)
                              }
                            >
                              <Minus className="size-3" />
                            </Button>

                            <span className="flex w-7 justify-center text-[11px] font-semibold">
                              {item.quantity}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none"
                              onClick={() =>
                                increment?.(item.parameterId, item.locationId)
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-rose-500 hover:bg-rose-50"
                            onClick={() =>
                              remove?.(item.parameterId, item.locationId)
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-4 px-5 py-4">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-bold text-slate-700">
                  Biaya Operasional
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Dihitung dalam penawaran
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">
                  Total Estimasi
                </span>

                <span className="text-xl font-bold text-primary tabular-nums">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                  className="mt-0.5"
                />

                <p className="text-xs leading-relaxed text-slate-500">
                  Saya telah memeriksa seluruh data pesanan.
                </p>
              </div>

              <Button
                type="button"
                className="h-11 w-full font-semibold"
                disabled={
                  items.length === 0 ||
                  !confirmed ||
                  createOrderMutation.isPending
                }
                onClick={handleCreateOrder}
              >
                {createOrderMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Buat Pesanan
              </Button>

              <p className="text-center text-[10px] text-slate-400">
                {totalQuantity} layanan dipilih
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
