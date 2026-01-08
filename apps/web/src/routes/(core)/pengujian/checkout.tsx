import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/pengujian/checkout")({
  component: RouteComponent,
});

function RouteComponent() {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [deleteLoadingItems, setDeleteLoadingItems] = useState<Set<string>>(
    new Set(),
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { data: cartItems } = useQuery(
    trpc.cart.getAllCartItems.queryOptions(),
  );

  const incrementCartItemQuantity = useMutation(
    trpc.cart.incrementCartItemQuantity.mutationOptions({
      onMutate: ({ cartItemId }) => {
        setLoadingItems((prev) => new Set(prev).add(cartItemId));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.cart.getAllCartItems.queryOptions(),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal menambah jumlah item di keranjang: ${error.message}`,
        );
      },
      onSettled: (_, __, { cartItemId }) => {
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cartItemId);
          return newSet;
        });
      },
    }),
  );

  const decrementCartItemQuantity = useMutation(
    trpc.cart.decrementCartItemQuantity.mutationOptions({
      onMutate: ({ cartItemId }) => {
        setLoadingItems((prev) => new Set(prev).add(cartItemId));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.cart.getAllCartItems.queryOptions(),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal mengurangi jumlah item di keranjang: ${error.message}`,
        );
      },
      onSettled: (_, __, { cartItemId }) => {
        setLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cartItemId);
          return newSet;
        });
      },
    }),
  );

  const deleteCartItem = useMutation(
    trpc.cart.deleteCartItem.mutationOptions({
      onMutate: ({ cartItemId }) => {
        setDeleteLoadingItems((prev) => new Set(prev).add(cartItemId));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.cart.getAllCartItems.queryOptions(),
        );

        globalSuccessToast("Item berhasil dihapus dari keranjang");
      },
      onError: (error) => {
        globalErrorToast(`Gagal menghapus item di keranjang: ${error.message}`);
      },
      onSettled: (_, __, { cartItemId }) => {
        setDeleteLoadingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cartItemId);
          return newSet;
        });
      },
    }),
  );

  const mappedLocationFromCartItem = useMemo(() => {
    if (cartItems) {
      return cartItems.map((location) => ({
        id: location.id,
        name: location.name,
      }));
    }
    return [];
  }, [cartItems]);

  const mappedItems = useMemo(() => {
    if (cartItems && currentLocation) {
      const location = cartItems.find((loc) => loc.id === currentLocation);
      return location?.items ?? [];
    }
    return cartItems?.flatMap((loc) => loc.items) ?? [];
  }, [cartItems, currentLocation]);

  const totalPrice = useMemo(() => {
    if (!cartItems) return 0;

    return cartItems.reduce((total, location) => {
      const locationTotal = location.items.reduce((locSum, cluster) => {
        const clusterTotal = cluster.items.reduce((clusterSum, item) => {
          return clusterSum + item.price * item.quantity;
        }, 0);
        return locSum + clusterTotal;
      }, 0);
      return total + locationTotal;
    }, 0);
  }, [cartItems]);

  return (
    <div className="flex flex-col gap-4">
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
        <SelectTrigger className="w-1/2">
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
      <div className="flex flex-row gap-2">
        <Card className="flex max-h-[calc(100vh-240px)] flex-1 flex-col space-y-6 overflow-y-auto">
          <CardContent className="space-y-6">
            {mappedItems.length > 0 ? (
              mappedItems.map((cluster) => (
                <div key={cluster.id}>
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
                          <div key={item.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="max-w-[calc(100%-325px)]">
                                <h3 className="truncate text-lg font-semibold text-gray-900">
                                  {item.parameter.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {item.parameter.category.name}
                                </p>
                              </div>

                              <div className="ml-4 flex items-center gap-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
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
                                <span className="min-w-25 text-right font-semibold text-gray-900">
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
              ))
            ) : (
              <Empty>
                <EmptyMedia>
                  <ShoppingCart className="h-12 w-12 text-slate-300" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Tidak ada item di keranjang</EmptyTitle>
                  <EmptyDescription>
                    Silakan tambahkan parameter pengujian dari daftar
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <div className="w-96 shrink-0">
          <Card className="sticky top-4 space-y-6 border-0 p-6 shadow-sm">
            {/* Transportasi Section */}
            <div>
              <div className="mb-4 flex items-start gap-2">
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Transportasi
                  </h3>
                  <p className="text-sm text-gray-500">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex cursor-pointer items-center gap-3 rounded-lg bg-blue-50 p-3">
                  <RadioGroup
                    value="transport1"
                    className="flex w-full items-center gap-2"
                  >
                    <Label
                      htmlFor="transport1"
                      className="flex-1 cursor-pointer font-normal"
                    >
                      Akomodasi mandiri
                    </Label>
                    <RadioGroupItem
                      value="transport1"
                      id="transport1"
                      className="self-end"
                    />
                  </RadioGroup>
                </div>
                <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-blue-300 p-3">
                  <RadioGroup
                    value="transport2"
                    className="flex w-full items-center gap-2"
                  >
                    <Label
                      htmlFor="transport2"
                      className="flex-1 cursor-pointer font-normal"
                    >
                      Akomodasi di tanggung Balai K3
                    </Label>
                    <RadioGroupItem value="transport2" id="transport2" />
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
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Total :</span>
                <span className="text-lg font-semibold text-gray-900">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <Button
                className="h-auto w-full bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                disabled={mappedItems.length === 0 || !isConfirmed}
              >
                Order
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
