import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

/**
 * Custom hook for cart filtering and mapping logic
 * Provides company/location filtering, mapped items, and total price calculation
 */
export function useCartFilters() {
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  const { data: cartItems } = useQuery(
    trpc.pengujian.cart.getAllCartItems.queryOptions(),
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

  const filteredCartItems = useMemo(() => {
    if (!cartItems) return [];
    let filtered = cartItems;
    if (currentCompany) {
      filtered = filtered.filter((company) => company.id === currentCompany);
    }
    if (currentLocation) {
      filtered = filtered
        .map((company) => ({
          ...company,
          locations: company.locations.filter(
            (location) => location.id === currentLocation,
          ),
        }))
        .filter((company) => company.locations.length > 0);
    }
    return filtered;
  }, [cartItems, currentCompany, currentLocation]);

  const mappedItems = useMemo(() => {
    return filteredCartItems.flatMap((company) =>
      company.locations.flatMap((location) => location.clusters),
    );
  }, [filteredCartItems]);

  const totalPrice = useMemo(() => {
    return mappedItems.reduce((clusterAcc, cluster) => {
      return (
        clusterAcc +
        cluster.items.reduce((itemAcc, item) => {
          return itemAcc + item.price * item.quantity;
        }, 0)
      );
    }, 0);
  }, [mappedItems]);

  return {
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
  };
}
