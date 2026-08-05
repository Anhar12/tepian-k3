import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getClusterColor } from "@/lib/cluster-colors";
import { cn } from "@/lib/utils";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

type CartCluster = {
  id: string;
  name: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    parameter: {
      name: string;
      category: { name: string };
      serviceType?: string;
    };
  }[];
};

interface CartItemsListProps {
  mappedItems: CartCluster[];
  loadingItems: Set<string>;
  deleteLoadingItems: Set<string>;
  onIncrement: (cartItemId: string) => void;
  onDecrement: (cartItemId: string) => void;
  onDelete: (cartItemId: string) => void;
  wrapperClassName?: string;
  itemClassName?: string;
}

/**
 * Shared cart items list rendered as cluster-grouped cards.
 * Used in both the cart sheet and the checkout page.
 */
export function CartItemsList({
  mappedItems,
  loadingItems,
  deleteLoadingItems,
  onIncrement,
  onDecrement,
  onDelete,
  wrapperClassName,
  itemClassName = "p-4 sm:p-6",
}: CartItemsListProps) {
  if (mappedItems.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12 text-slate-300" />}
        title="Tidak ada item di keranjang"
        description="Silakan tambahkan parameter pengujian dari daftar"
      />
    );
  }

  return (
    <div className={cn("space-y-6", wrapperClassName)}>
      {mappedItems.map((cluster) => (
        <div key={cluster.id}>
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
          <Card className="rounded-t-none rounded-b-2xl">
            <div className="divide-y">
              {cluster.items.map((item) => {
                const isLoading = loadingItems.has(item.id);
                return (
                  <div key={item.id} className={itemClassName}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 sm:max-w-[calc(100%-325px)]">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                            {item.parameter.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.parameter.category.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:ml-4 sm:gap-4">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-2 py-1.5 sm:px-3 sm:py-2">
                          <button
                            onClick={() => onDecrement(item.id)}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="flex min-w-6 items-center justify-center font-semibold text-blue-600 tabular-nums">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() => onIncrement(item.id)}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="min-w-20 text-right text-sm font-semibold text-gray-900 tabular-nums sm:min-w-25 sm:text-base">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                        <button
                          onClick={() => onDelete(item.id)}
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
      ))}
    </div>
  );
}
