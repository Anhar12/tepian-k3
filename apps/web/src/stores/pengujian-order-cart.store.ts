import { create } from "zustand";

export interface DraftOrderItem {
  parameterId: string;
  parameterName: string;
  categoryName: string;
  locationId: string;
  locationName: string;
  quantity: number;
  price: number;
}

interface DraftOrderCartStore {
  items: DraftOrderItem[];
  addItems: (items: DraftOrderItem[]) => void;
  increment: (parameterId: string, locationId: string) => void;
  decrement: (parameterId: string, locationId: string) => void;
  remove: (parameterId: string, locationId: string) => void;
  clear: () => void;
}

/** Menyimpan draft item order selama wizard aktif tanpa persistensi database. */
export const usePengujianOrderCart = create<DraftOrderCartStore>((set) => ({
  items: [],
  addItems: (items) =>
    set((state) => {
      const next = [...state.items];
      for (const item of items) {
        const index = next.findIndex(
          (current) =>
            current.parameterId === item.parameterId &&
            current.locationId === item.locationId,
        );
        if (index >= 0)
          next[index] = {
            ...next[index],
            quantity: next[index].quantity + item.quantity,
          };
        else next.push(item);
      }
      return { items: next };
    }),
  increment: (parameterId, locationId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.parameterId === parameterId && item.locationId === locationId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    })),
  decrement: (parameterId, locationId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.parameterId === parameterId && item.locationId === locationId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })),
  remove: (parameterId, locationId) =>
    set((state) => ({
      items: state.items.filter(
        (item) =>
          !(item.parameterId === parameterId && item.locationId === locationId),
      ),
    })),
  clear: () => set({ items: [] }),
}));
