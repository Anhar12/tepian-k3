import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import z from "zod";
import { create } from "zustand";

const cartSchema = z.array(
  z.object({
    id: z.uuidv7(),
    name: z.string(),
    items: z.array(orderItemSchema.createOrderItemSchema),
  }),
);

interface CartStore {
  cartItems: z.infer<typeof cartSchema>;
  setCartItems: (items: z.infer<typeof cartSchema>) => void;
  incrementItemQuantity: (
    locationId: string,
    parameterId: string,
    quantity: number,
  ) => void;
  decrementItemQuantity: (
    locationId: string,
    parameterId: string,
    quantity: number,
  ) => void;
  removeItem: (locationId: string, parameterId: string) => void;
  updateItemQuantity: (
    locationId: string,
    parameterId: string,
    quantity: number,
  ) => void;
  resetCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cartItems: [],
  setCartItems: (items) =>
    set((state) => {
      const firstItem = items[0];
      if (!firstItem) return state;

      const index = state.cartItems.findIndex(
        (item) => item.id === firstItem.id,
      );
      if (index !== -1) {
        const updatedCartItems = [...state.cartItems];
        updatedCartItems[index] = firstItem;
        return { cartItems: updatedCartItems };
      } else {
        return { cartItems: [...state.cartItems, ...items] };
      }
    }),
  incrementItemQuantity: (locationId, parameterId, quantity) =>
    set((state) => {
      const updatedCartItems = state.cartItems.map((item) => {
        if (item.id === locationId) {
          const updatedItems = item.items.map((param) => {
            if (param.parameterId === parameterId) {
              return {
                ...param,
                quantity: param.quantity + quantity,
              };
            }
            return param;
          });
          return { ...item, items: updatedItems };
        }
        return item;
      });
      return { cartItems: updatedCartItems };
    }),
  decrementItemQuantity: (locationId, parameterId, quantity) =>
    set((state) => {
      const updatedCartItems = state.cartItems.map((item) => {
        if (item.id === locationId) {
          const updatedItems = item.items.map((param) => {
            if (param.parameterId === parameterId) {
              return {
                ...param,
                quantity: param.quantity - quantity,
              };
            }
            return param;
          });
          return { ...item, items: updatedItems };
        }
        return item;
      });
      return { cartItems: updatedCartItems };
    }),
  removeItem: (locationId, parameterId) =>
    set((state) => {
      const updatedCartItems = state.cartItems
        .map((item) => {
          if (item.id === locationId) {
            const filteredItems = item.items.filter(
              (param) => param.parameterId !== parameterId,
            );
            return { ...item, items: filteredItems };
          }
          return item;
        })
        .filter((item) => item.items.length > 0);
      return { cartItems: updatedCartItems };
    }),
  updateItemQuantity: (locationId, parameterId, quantity) =>
    set((state) => {
      const updatedCartItems = state.cartItems.map((item) => {
        if (item.id === locationId) {
          const updatedItems = item.items.map((param) => {
            if (param.parameterId === parameterId) {
              return {
                ...param,
                quantity: quantity,
              };
            }
            return param;
          });
          return { ...item, items: updatedItems };
        }
        return item;
      });
      return { cartItems: updatedCartItems };
    }),
  resetCart: () => set({ cartItems: [] }),
}));
