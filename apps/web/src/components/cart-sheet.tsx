import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartSheetStore } from "@/stores/cart-sheet.stores";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCartMutations } from "@/hooks/use-cart-mutations";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { getClusterColor } from "@/lib/cluster-colors";
import { Minus, Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "./ui/empty-state";

export default function CartSheet() {
  const navigate = useNavigate();

  const isOpen = useCartSheetStore((state) => state.isOpen);
  const setIsOpen = useCartSheetStore((state) => state.setIsOpen);

  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  const { data: cartItems } = useQuery(
    trpc.cart.getAllCartItems.queryOptions(),
  );

  const {
    incrementCartItemQuantity,
    decrementCartItemQuantity,
    deleteCartItem,
    loadingItems,
    deleteLoadingItems,
  } = useCartMutations();

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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent closeClassName="text-white" className="w-1/2">
        <SheetHeader className="bg-primary/50">
          <SheetTitle className="text-white">Keranjang</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-4">
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
          <div className="flex flex-col space-y-6">
            {mappedItems.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] space-y-6 overflow-y-auto">
                {mappedItems.map((cluster) => {
                  return (
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
                                        aria-label="Kurangi jumlah"
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
                                        aria-label="Tambah jumlah"
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
                                      aria-label="Hapus item dari keranjang"
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
          </div>
        </div>
        <SheetFooter>
          {/* Total */}
          <div className="flex flex-1 flex-col">
            <span className="text-sm text-gray-500">Total Harga</span>
            <span className="text-2xl font-bold text-gray-900">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
          <Button
            disabled={!cartItems || cartItems.length === 0}
            onClick={() => {
              setIsOpen(false);
              navigate({
                to: "/pengujian/checkout",
              });
            }}
          >
            Checkout
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
