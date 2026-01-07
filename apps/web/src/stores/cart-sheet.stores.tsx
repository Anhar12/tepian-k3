import { create } from "zustand";

interface CartSheetStore {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const useCartSheetStore = create<CartSheetStore>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
}));
