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
  }, [cartItems, currentCompany, currentLocation]);

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

  return {
    cartItems,
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
