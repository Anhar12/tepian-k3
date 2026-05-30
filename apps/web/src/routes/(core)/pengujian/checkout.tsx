import { CartItemsList } from "@/components/cart-items-list";
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
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Car, Hotel, Loader2, Plane, Ship, Wallet, Wrench } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(core)/pengujian/checkout")({
  head: () => pageHead("Pengujian - Checkout"),
  component: RouteComponent,
});

const autoItems = [
  {
    id: "uang-harian",
    icon: <Wallet className="h-4 w-4 text-white" />,
    label: "Uang Harian",
    desc: "Uang Harian petugas selama pengujian berlangsung mengacu SBM yang berlaku",
  },
  {
    id: "operasional",
    icon: <Wrench className="h-4 w-4 text-white" />,
    label: "Operasional Lapangan",
    desc: "Biaya operasional di lokasi seperti transportasi lokal & logistik disediakan oleh perusahaan",
  },
];

const optionalItems = [
  {
    id: "udara",
    icon: <Plane className="h-4 w-4 text-blue-500" />,
    label: "Transportasi Udara (PP)",
  },
  {
    id: "laut",
    icon: <Ship className="h-4 w-4 text-blue-500" />,
    label: "Transportasi Laut/Sungai (PP)",
  },
  {
    id: "darat-bandara",
    icon: <Car className="h-4 w-4 text-blue-500" />,
    label: "Transportasi Darat menuju Bandara/Pelabuhan (PP)",
  },
  {
    id: "darat",
    icon: <Car className="h-4 w-4 text-blue-500" />,
    label: "Transportasi Darat (PP)",
  },
  {
    id: "penginapan",
    icon: <Hotel className="h-4 w-4 text-blue-500" />,
    label: "Penginapan",
  },
];

function RouteComponent() {
  const navigate = Route.useNavigate();

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

  const [optionalSelections, setOptionalSelections] = useState<Set<string>>(
    new Set(),
  );
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
        setOptionalSelections(new Set());

        navigate({
          to: "/pengujian/transaksi",
        });
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat order: ${error.message}`);
      },
    }),
  );

  const toggleOptional = (id: string) => {
    setOptionalSelections((prev) => {
      const next = new Set(prev);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        orderData: { companyId },
        orderItems: items,
      }),
    );

    createOrderMutation.mutate({
      coverFlightIncluded: optionalSelections.has("udara"),
      coverGroundTransportationIncluded: optionalSelections.has("darat"),
      coverGroundTransportationToAirportOrHarbour:
        optionalSelections.has("darat-bandara"),
      coverLodgingIncluded: optionalSelections.has("penginapan"),
      coverWaterTransportationIncluded: optionalSelections.has("laut"),
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
            <CartItemsList
              mappedItems={mappedItems}
              loadingItems={loadingItems}
              deleteLoadingItems={deleteLoadingItems}
              onIncrement={(id) =>
                incrementCartItemQuantity.mutate({ cartItemId: id })
              }
              onDecrement={(id) =>
                decrementCartItemQuantity.mutate({ cartItemId: id })
              }
              onDelete={(id) => deleteCartItem.mutate({ cartItemId: id })}
              wrapperClassName="space-y-4 sm:space-y-6 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto"
            />
          </CardContent>
        </Card>

        <div className="w-full lg:w-96 lg:shrink-0">
          <Card className="border-0 p-4 shadow-sm sm:p-6 lg:sticky lg:top-4">
            <CardHeader className="p-0">
              <CardTitle>Biaya Operasional Pengujian</CardTitle>
              <CardDescription>
                Pilih kebutuhan transportasi dan akomodasi selama pengujian
                berlangsung. Biaya akan dihitung dalam penawaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(75vh-250px)] space-y-4">
                <div className="flex flex-col gap-6 px-2">
                  {/* Item Biaya Tagihan Otomatis */}
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-bold text-gray-700">
                      Item biaya tagihan otomatis
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

                  {/* Item Biaya Tagihan Opsional */}
                  <div className="space-y-2">
                    <div className="px-1">
                      <p className="text-sm font-bold text-gray-700">
                        Item Biaya Tagihan Opsional
                      </p>
                      <p className="text-xs text-gray-400">
                        Menyesuaikan kondisi lapangan/lokasi pengujian.
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-gray-600">
                      <p className="mb-2 font-semibold text-amber-700">
                        ⚠ Perhatian — Cara pengisian:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-amber-500 bg-amber-500 text-white">
                            ✓
                          </span>
                          <span>
                            <span className="font-semibold text-gray-700">
                              Dicentang
                            </span>{" "}
                            — biaya ditanggung &amp; ditagihkan ke perusahaan
                            pemohon melalui invoice.
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-gray-300 bg-white" />
                          <span>
                            <span className="font-semibold text-gray-700">
                              Tidak dicentang
                            </span>{" "}
                            — dianggap sudah disediakan sendiri oleh perusahaan
                            pemohon, tidak masuk invoice.
                          </span>
                        </div>
                      </div>
                    </div>
                    {optionalItems.map((item) => {
                      const isChecked = optionalSelections.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleOptional(item.id)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                            isChecked
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleOptional(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-sm font-semibold text-gray-800">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

                  <div
                    className="flex cursor-pointer items-start gap-3"
                    onClick={() => setConfirmed(!confirmed)}
                  >
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(val) => setConfirmed(val === true)}
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
              <div className="space-y-4">
                {optionalSelections.size > 0 && (
                  <div className="text-sm text-gray-600">
                    * Total biaya akan diupdate pada saat penawaran dikirimkan
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Total :</span>
                  <span className="text-lg font-semibold text-gray-900 tabular-nums">
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
