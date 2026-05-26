import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartSheetStore } from "@/stores/cart-sheet.stores";
import { useCartMutations } from "@/hooks/use-cart-mutations";
import { useCartFilters } from "@/hooks/use-cart-filters";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CartItemsList } from "./cart-items-list";
import { useNavigate } from "@tanstack/react-router";

export default function CartSheet() {
  const navigate = useNavigate();

  const isOpen = useCartSheetStore((state) => state.isOpen);
  const setIsOpen = useCartSheetStore((state) => state.setIsOpen);

  const {
    cartItems,
    currentLocation,
    setCurrentLocation,
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent closeClassName="text-white" className="w-1/2">
        <SheetHeader className="bg-primary/50">
          <SheetTitle className="text-white">Keranjang</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <Select
            value={currentLocation ?? "all"}
            onValueChange={(value) => {
              setCurrentLocation(value === "all" ? null : value);
            }}
          >
            <SelectTrigger className="w-full">
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
            wrapperClassName="max-h-[calc(100vh-300px)] overflow-y-auto"
            itemClassName="p-6"
          />
        </div>
        <SheetFooter>
          <div className="flex flex-1 flex-col">
            <span className="text-sm text-gray-500">Total Harga</span>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
          <Button
            disabled={!cartItems || cartItems.length === 0}
            onClick={() => {
              setIsOpen(false);
              navigate({ to: "/pengujian/checkout" });
            }}
          >
            Checkout
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
