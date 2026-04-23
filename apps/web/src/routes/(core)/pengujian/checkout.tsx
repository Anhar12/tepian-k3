import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCartFilters } from "@/hooks/use-cart-filters";
import { useCartMutations } from "@/hooks/use-cart-mutations";
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Car,
  CheckCircle2,
  Home,
  Hotel,
  Info,
  Loader2,
  Minus,
  Plane,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(core)/pengujian/checkout")({
  head: () => pageHead("Pengujian - Checkout"),
  component: RouteComponent,
});

const checkboxItems = [
  {
    id: "pesawat",
    icon: <Plane className="h-4 w-4 text-blue-500" />,
    label: "Pesawat PP",
    badge: "Opsional",
    descUnchecked:
      "Tiket pesawat pulang-pergi ditanggung mandiri atau disediakan oleh perusahaan pemohon.",
    descChecked:
      "Biaya tiket pesawat PP akan dimasukkan ke dokumen penawaran oleh admin.",
  },
  {
    id: "darat",
    icon: <Car className="h-4 w-4 text-blue-500" />,
    label: "Transportasi Darat",
    descUnchecked:
      "Perjalanan darat dari bandara/kota ke lokasi perusahaan disediakan oleh perusahaan pemohon.",
    descChecked:
      "Biaya transportasi darat ke lokasi perusahaan akan dimasukkan ke dokumen penawaran.",
  },
  {
    id: "penginapan",
    icon: <Hotel className="h-4 w-4 text-blue-500" />,
    label: "Penginapan",
    descUnchecked:
      "Biaya hotel atau tempat menginap selama pengujian ditanggung mandiri atau oleh perusahaan pemohon.",
    descChecked:
      "Biaya penginapan (hotel/guest house) selama pengujian berlangsung akan masuk ke penawaran.",
  },
  {
    id: "akomodasi",
    icon: <Home className="h-4 w-4 text-blue-500" />,
    label: "Akomodasi",
    descUnchecked:
      "Kebutuhan akomodasi harian (makan, konsumsi, dll) ditanggung mandiri atau perusahaan pemohon.",
    descChecked:
      "Biaya akomodasi harian seperti konsumsi & kebutuhan lapangan akan masuk ke penawaran.",
  },
];

const autoItems = [
  {
    id: "uang-harian",
    icon: <Wallet className="h-4 w-4 text-white" />,
    label: "Uang Harian",
    desc: "Biaya uang saku harian petugas selama pengujian berlangsung. Dihitung per hari kerja di lapangan.",
  },
  {
    id: "operasional",
    icon: <Wrench className="h-4 w-4 text-white" />,
    label: "Operasional Lapangan",
    desc: "Biaya operasional di lokasi seperti transportasi lokal & logistik alat. Disediakan oleh perusahaan pemohon.",
  },
];

function RouteComponent() {
  const {
    cartItems,
    filteredCartItems,
    currentCompany,
    setCurrentCompany,
    currentLocation,
    setCurrentLocation,
    mappedCompanyFromCartItem,
    mappedLocationFromCartItem,
    mappedItems,
    totalPrice,
  } = useCartFilters();

  const {
    incrementCartItemQuantity,
    decrementCartItemQuantity,
    deleteCartItem,
    loadingItems,
    deleteLoadingItems,
  } = useCartMutations();

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const createOrderMutation = useMutation(
    trpc.pengujian.order.createOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.cart.getAllCartItems.queryOptions(),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getAllOrders.queryOptions({}),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.cart.getCartItemCount.queryOptions(),
        );
        globalSuccessToast("Order berhasil dibuat");

        setCurrentCompany(null);
        setCurrentLocation(null);
        setConfirmed(false);
        checked.clear();
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat order: ${error.message}`);
      },
    }),
  );

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleOrderCreate = () => {
    if (!confirmed) {
      globalErrorToast(
        "Silakan konfirmasi bahwa data yang dimasukkan sudah benar sebelum melakukan order.",
      );
      return;
    }

    if (!cartItems || filteredCartItems.length === 0) return;

    const groupedItemsByCompany: Record<
      string,
      {
        id: string;
        name: string;
        items: {
          id: string;
          parameterId: string;
          locationId: string;
          quantity: number;
          price: number;
        }[];
      }[]
    > = {};

    filteredCartItems.forEach((company) => {
      company.locations.forEach((location) => {
        location.clusters.forEach((cluster) => {
          cluster.items.forEach((item) => {
            if (!groupedItemsByCompany[company.id]) {
              groupedItemsByCompany[company.id] = [];
            }
            const companyGroup = groupedItemsByCompany[company.id];
            if (!companyGroup) return;

            let companyEntry = companyGroup.find(
              (entry) => entry.id === location.id,
            );
            if (!companyEntry) {
              companyEntry = {
                id: location.id,
                name: location.name,
                items: [],
              };
              companyGroup.push(companyEntry);
            }
            companyEntry.items.push({
              id: item.id,
              parameterId: item.parameter.id,
              locationId: location.id,
              quantity: item.quantity,
              price: item.price,
            });
          });
        });
      });
    });

    const orderItems = Object.entries(groupedItemsByCompany).map(
      ([companyId, items]) => ({
        orderData: {
          companyId,
        },
        orderItems: items,
      }),
    );

    createOrderMutation.mutate({
      coverFlightIncluded: checked.has("pesawat"),
      coverGroundTransportationIncluded: checked.has("darat"),
      coverLodgingIncluded: checked.has("penginapan"),
      coverAccommodationIncluded: checked.has("akomodasi"),
      customerNote: note,
      data: orderItems,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={currentCompany ?? "all"}
          onValueChange={(value) => {
            setCurrentLocation(null);
            setCurrentCompany(value === "all" ? null : value);
          }}
        >
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Semua Perusahaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Perusahaan</SelectLabel>
              <SelectItem value="all">Semua Perusahaan</SelectItem>
              {mappedCompanyFromCartItem.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={currentLocation ?? "all"}
          onValueChange={(value) => {
            setCurrentLocation(value === "all" ? null : value);
          }}
        >
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Semua Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Lokasi</SelectLabel>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {mappedLocationFromCartItem.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-2">
        <Card className="flex flex-1 flex-col space-y-6">
          <CardContent className="h-full space-y-6">
            {mappedItems.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto">
                {mappedItems.map((cluster, idx) => {
                  return (
                    <div key={idx} className="w-full max-w-3xl">
                      {/* Header */}
                      <div
                        className={cn(
                          getClusterColor(cluster.name),
                          "rounded-t-2xl px-6 py-4 text-white",
                        )}
                      >
                        <h1 className="text-center text-xl font-semibold text-white">
                          {cluster.name}
                        </h1>
                      </div>

                      {/* Cart Items */}
                      <Card className="rounded-t-none rounded-b-2xl">
                        <div className="divide-y">
                          {cluster.items.map((item) => {
                            const isLoading = loadingItems.has(item.id);

                            return (
                              <div key={item.id} className="p-4 sm:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0 flex-1 sm:max-w-[calc(100%-325px)]">
                                    <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                                      {item.parameter.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {item.parameter.category.name}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between gap-3 sm:ml-4 sm:gap-4">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-2 py-1.5 sm:px-3 sm:py-2">
                                      <button
                                        onClick={() =>
                                          decrementCartItemQuantity.mutate({
                                            cartItemId: item.id,
                                          })
                                        }
                                        disabled={isLoading}
                                        className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="flex min-w-6 items-center justify-center font-semibold text-blue-600">
                                        {isLoading ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          item.quantity
                                        )}
                                      </span>
                                      <button
                                        onClick={() =>
                                          incrementCartItemQuantity.mutate({
                                            cartItemId: item.id,
                                          })
                                        }
                                        disabled={isLoading}
                                        className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>

                                    {/* Price */}
                                    <span className="min-w-20 text-right text-sm font-semibold text-gray-900 sm:min-w-25 sm:text-base">
                                      Rp {item.price.toLocaleString("id-ID")}
                                    </span>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() =>
                                        deleteCartItem.mutate({
                                          cartItemId: item.id,
                                        })
                                      }
                                      disabled={isLoading}
                                      className="text-red-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {deleteLoadingItems.has(item.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<ShoppingCart className="h-12 w-12 text-slate-300" />}
                title="Tidak ada item di keranjang"
                description="Silakan tambahkan parameter pengujian dari daftar"
              />
            )}
          </CardContent>
        </Card>
        <div className="w-full lg:w-96 lg:shrink-0">
          <Card className="border-0 p-4 shadow-sm sm:p-6 lg:sticky lg:top-4">
            <CardHeader className="p-0">
              <CardTitle>Transportasi & Akomodasi</CardTitle>
              <CardDescription>
                Pilih kebutuhan transportasi dan akomodasi selama pengujian
                berlangsung. Biaya akan dihitung dalam penawaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(75vh-250px)] space-y-4">
                <div className="flex flex-col gap-6 px-2">
                  {/* Transportasi Section */}
                  <div className="space-y-2">
                    {checkboxItems.map((item) => {
                      const isChecked = checked.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggle(item.id)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${
                            isChecked
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggle(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 shrink-0 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="mb-1 block text-sm font-semibold text-gray-800">
                                {item.label}
                              </span>
                              <div className="flex min-h-10 items-start gap-1">
                                {isChecked ? (
                                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                                ) : (
                                  <Info className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                                )}
                                <p
                                  className={`text-xs leading-relaxed ${isChecked ? "text-blue-600" : "text-gray-400"}`}
                                >
                                  {isChecked
                                    ? item.descChecked
                                    : item.descUnchecked}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto-billed items */}
                  <div className="mt-3 space-y-2">
                    <p className="px-1 text-xs font-medium text-gray-500">
                      Otomatis ditagihkan
                    </p>
                    {autoItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-blue-600 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/20">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-blue-100">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Catatan */}
                  <div>
                    <p className="mb-2 text-sm font-bold text-gray-800">
                      Catatan
                    </p>
                    <Textarea
                      rows={3}
                      placeholder="Tambahkan catatan atau informasi tambahan untuk admin..."
                      className="resize-none rounded-xl border-gray-200 text-sm"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {/* Checkbox Confirmation */}
                  <div
                    className="flex cursor-pointer items-start gap-3"
                    onClick={() => setConfirmed(!confirmed)}
                  >
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(checked) =>
                        setConfirmed(checked === true)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <p className="text-xs leading-relaxed text-gray-500">
                      Saya memastikan bahwa data yang dimasukkan sudah benar dan
                      sesuai dengan kebutuhan pengujian.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="flex-col items-stretch gap-4 p-0">
              {/* Total and CTA */}
              <div className="space-y-4">
                {checked.size > 0 ? (
                  <div className="text-sm text-gray-600">
                    * Total biaya akan diupdate pada saat penawaran dikirimkan
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Total :</span>
                  <span className="text-lg font-semibold text-gray-900">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <Button
                  className="h-auto w-full bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                  disabled={
                    mappedItems.length === 0 ||
                    !confirmed ||
                    createOrderMutation.isPending
                  }
                  onClick={handleOrderCreate}
                >
                  {createOrderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Order
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
