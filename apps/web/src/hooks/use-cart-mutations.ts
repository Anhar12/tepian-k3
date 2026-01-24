import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { globalErrorToast } from "@/lib/toast";
import { useState, useCallback } from "react";

/**
 * Custom hook for cart mutations with shared loading state management
 * Consolidates all cart mutation logic (increment, decrement, delete) with consistent error handling
 */
export function useCartMutations() {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [deleteLoadingItems, setDeleteLoadingItems] = useState<Set<string>>(
    new Set(),
  );

  const invalidateCart = useCallback(async () => {
    await queryClient.invalidateQueries(
      trpc.cart.getAllCartItems.queryOptions(),
    );
  }, []);

  const addLoadingItem = useCallback((cartItemId: string) => {
    setLoadingItems((prev) => new Set(prev).add(cartItemId));
  }, []);

  const removeLoadingItem = useCallback((cartItemId: string) => {
    setLoadingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cartItemId);
      return newSet;
    });
  }, []);

  const addDeleteLoadingItem = useCallback((cartItemId: string) => {
    setDeleteLoadingItems((prev) => new Set(prev).add(cartItemId));
  }, []);

  const removeDeleteLoadingItem = useCallback((cartItemId: string) => {
    setDeleteLoadingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cartItemId);
      return newSet;
    });
  }, []);

  const incrementCartItemQuantity = useMutation(
    trpc.cart.incrementCartItemQuantity.mutationOptions({
      onMutate: ({ cartItemId }) => {
        addLoadingItem(cartItemId);
      },
      onSuccess: invalidateCart,
      onError: (error) => {
        globalErrorToast(
          `Gagal menambah jumlah item di keranjang: ${error.message}`,
        );
      },
      onSettled: (_, __, { cartItemId }) => {
        removeLoadingItem(cartItemId);
      },
    }),
  );

  const decrementCartItemQuantity = useMutation(
    trpc.cart.decrementCartItemQuantity.mutationOptions({
      onMutate: ({ cartItemId }) => {
        addLoadingItem(cartItemId);
      },
      onSuccess: invalidateCart,
      onError: (error) => {
        globalErrorToast(
          `Gagal mengurangi jumlah item di keranjang: ${error.message}`,
        );
      },
      onSettled: (_, __, { cartItemId }) => {
        removeLoadingItem(cartItemId);
      },
    }),
  );

  const deleteCartItem = useMutation(
    trpc.cart.deleteCartItem.mutationOptions({
      onMutate: ({ cartItemId }) => {
        addDeleteLoadingItem(cartItemId);
      },
      onSuccess: invalidateCart,
      onError: (error) => {
        globalErrorToast(`Gagal menghapus item di keranjang: ${error.message}`);
      },
      onSettled: (_, __, { cartItemId }) => {
        removeDeleteLoadingItem(cartItemId);
      },
    }),
  );

  return {
    incrementCartItemQuantity,
    decrementCartItemQuantity,
    deleteCartItem,
    loadingItems,
    deleteLoadingItems,
  };
}
