import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useCartFilters } from "@/hooks/use-cart-filters";
import { useCartMutations } from "@/hooks/use-cart-mutations";
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(core)/pengujian/checkout")({
  head: () => pageHead("Pengujian - Checkout"),
  component: RouteComponent,
});

function RouteComponent() {
  const {
    cartItems,
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

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [coverTransportationIncluded, setCoverTransportationIncluded] =
    useState(false);
  const [coverAccommodationIncluded, setCoverAccommodationIncluded] =
    useState(false);

  const createOrderMutation = useMutation(
    trpc.order.createOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.cart.getAllCartItems.queryOptions(),
        );
        await queryClient.invalidateQueries(
          trpc.order.getAllOrders.queryOptions({}),
        );
        await queryClient.invalidateQueries(
          trpc.cart.getCartItemCount.queryOptions(),
        );
        globalSuccessToast("Order berhasil dibuat");

        setCurrentCompany(null);
        setCurrentLocation(null);
        setIsConfirmed(false);
        setCoverTransportationIncluded(false);
        setCoverAccommodationIncluded(false);
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat order: ${error.message}`);
      },
    }),
  );

  const handleOrderCreate = () => {
    if (!isConfirmed) {
      globalErrorToast(
        "Silakan konfirmasi bahwa data yang dimasukkan sudah benar sebelum melakukan order.",
      );
      return;
    }

    if (!cartItems) return;

    /**
     * Prepare order items payload
     * the end payload shoulbd be like this:
     * [
     *    { companyId: string, items: [ { parameterId: string, quantity: number, price: number } ] }
     * ]
     * grouped by locationId and companyId
     * what if there was mulitple companies in cart?
     * then we need to group items by companyId
     */

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

    cartItems.forEach((company) => {
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
      coverTransportationIncluded,
      coverAccommodationIncluded,
      data: orderItems,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={currentCompany ?? undefined}
          onValueChange={(value) => {
            if (value === currentCompany) {
              setCurrentCompany(null);
            } else {
              setCurrentCompany(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Pilih perusahaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Area</SelectLabel>
              {mappedCompanyFromCartItem.length > 0 ? (
                mappedCompanyFromCartItem.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="empty" disabled>
                  Tidak ada perusahaan
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={currentLocation ?? undefined}
          onValueChange={(value) => {
            if (value === currentLocation) {
              setCurrentLocation(null);
            } else {
              setCurrentLocation(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Pilih area" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Area</SelectLabel>
              {mappedLocationFromCartItem.length > 0 ? (
                mappedLocationFromCartItem.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="empty" disabled>
                  Tidak ada area
                </SelectItem>
              )}
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
            {/* Transportasi Section */}
            <div>
              <div className="mb-4 flex items-start gap-2">
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Transportasi
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pilih opsi transportasi selama pengujian berlangsung.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex cursor-pointer items-center gap-3">
                  <RadioGroup
                    defaultValue="false"
                    value={String(coverTransportationIncluded)}
                    onValueChange={(value) =>
                      setCoverTransportationIncluded(value === "true")
                    }
                    className="flex w-full flex-col gap-4"
                  >
                    <div className="flex flex-1 flex-row items-center gap-3 rounded-lg bg-blue-50 p-3">
                      <RadioGroupItem
                        value="false"
                        id="cover-transportation-false"
                      />
                      <Label
                        htmlFor="cover-transportation-false"
                        className="cursor-pointer font-normal"
                      >
                        Transportasi ditanggung pemohon pengujian
                      </Label>
                    </div>
                    <div className="flex flex-1 flex-row items-center gap-3 rounded-lg bg-blue-50 p-3">
                      <RadioGroupItem
                        value="true"
                        id="cover-transportation-true"
                      />
                      <Label
                        htmlFor="cover-transportation-true"
                        className="cursor-pointer font-normal"
                      >
                        Transportasi di tanggung Balai K3
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <Separator />

            {/* Akomodasi Section */}
            <div>
              <div className="mb-4 flex items-start gap-2">
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Akomodasi
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pilih opsi akomodasi selama pengujian berlangsung.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex cursor-pointer items-center gap-3">
                  <RadioGroup
                    defaultValue="false"
                    value={String(coverAccommodationIncluded)}
                    onValueChange={(value) =>
                      setCoverAccommodationIncluded(value === "true")
                    }
                    className="flex w-full flex-col gap-4"
                  >
                    <div className="flex flex-1 flex-row items-center gap-3 rounded-lg bg-blue-50 p-3">
                      <RadioGroupItem
                        value="false"
                        id="cover-accommodation-false"
                      />
                      <Label
                        htmlFor="cover-accommodation-false"
                        className="cursor-pointer font-normal"
                      >
                        Akomodasi ditanggung pemohon pengujian
                      </Label>
                    </div>
                    <div className="flex flex-1 flex-row items-center gap-3 rounded-lg bg-blue-50 p-3">
                      <RadioGroupItem
                        value="true"
                        id="cover-accommodation-true"
                      />
                      <Label
                        htmlFor="cover-accommodation-true"
                        className="cursor-pointer font-normal"
                      >
                        Akomodasi di tanggung Balai K3
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <Separator />

            {/* Checkbox Confirmation */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="confirmation"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <Label htmlFor="confirmation" className="text-sm/5 font-normal">
                Anda telah memastikan bahwa data yang dimasukkan sudah benar dan
                sesuai dengan kebutuhan pengujian.
              </Label>
            </div>

            {/* Total and CTA */}
            <div className="space-y-4">
              {coverTransportationIncluded || coverAccommodationIncluded ? (
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
                  !isConfirmed ||
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
          </Card>
        </div>
      </div>
    </div>
  );
}
