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
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
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

  const mappedCompanyFromCartItem = useMemo(() => {
    if (cartItems) {
      return cartItems.map((company) => ({
        id: company.id,
        name: company.name,
      }));
    }
    return [];
  }, [cartItems]);

  const mappedLocationFromCartItem = useMemo(() => {
    if (cartItems && currentCompany) {
      const company = cartItems.find((comp) => comp.id === currentCompany);
      return (
        company?.locations.map((location) => ({
          id: location.id,
          name: location.name,
        })) ?? []
      );
    }
    return cartItems
      ? cartItems.flatMap((comp) =>
          comp.locations.map((location) => ({
            id: location.id,
            name: location.name,
          })),
        )
      : [];
  }, [cartItems, currentCompany]);

  const mappedItems = useMemo(() => {
    if (cartItems) {
      let filteredItems = cartItems;
      if (currentCompany) {
        filteredItems = filteredItems.filter(
          (company) => company.id === currentCompany,
        );
      }
      if (currentLocation) {
        filteredItems = filteredItems
          .map((company) => ({
            ...company,
            locations: company.locations.filter(
              (location) => location.id === currentLocation,
            ),
          }))
          .filter((company) => company.locations.length > 0);
      }
      return filteredItems.flatMap((company) =>
        company.locations.flatMap((location) => location.clusters),
      );
    }
    return [];
  }, [cartItems, currentLocation]);

  const totalPrice = useMemo(() => {
    if (!cartItems) return 0;

    return cartItems.reduce((companyAcc, company) => {
      return (
        companyAcc +
        company.locations.reduce((locationAcc, location) => {
          return (
            locationAcc +
            location.clusters.reduce((clusterAcc, cluster) => {
              return (
                clusterAcc +
                cluster.items.reduce((itemAcc, item) => {
                  return itemAcc + item.price * item.quantity;
                }, 0)
              );
            }, 0)
          );
        }, 0)
      );
    }, 0);
  }, [cartItems]);

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
            let companyEntry = groupedItemsByCompany[company.id].find(
              (entry) => entry.id === location.id,
            );
            if (!companyEntry) {
              companyEntry = {
                id: location.id,
                name: location.name,
                items: [],
              };
              groupedItemsByCompany[company.id].push(companyEntry);
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

    // const orderItems = cartItems
    //   .map((company) =>
    //     company.locations.map((location) => ({
    //       orderData: {
    //         companyId: company.id,
    //       },
    //       orderItems: [
    //         {
    //           id: location.id,
    //           name: location.name,
    //           items: location.clusters.flatMap((cluster) =>
    //             cluster.items.map((item) => ({
    //               id: item.id,
    //               parameterId: item.parameter.id,
    //               price: item.price,
    //               quantity: item.quantity,
    //             })),
    //           ),
    //         },
    //       ],
    //     })),
    //   )
    //   .flat();

    createOrderMutation.mutate(orderItems);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
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
          <SelectTrigger className="w-1/2">
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
      </div>
      <div className="flex flex-row gap-2">
        <Card className="flex flex-1 flex-col space-y-6">
          <CardContent className="h-full space-y-6">
            {mappedItems.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] space-y-6 overflow-y-auto">
                {mappedItems.map((cluster, idx) => {
                  return (
                    <div key={idx} className="max-w-3xl">
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
