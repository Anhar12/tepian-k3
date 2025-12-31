import { create } from "zustand";

interface TestingLocationDialogStore {
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (isOpen: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  editingTestingLocationId: string | null;
  setEditingTestingLocationId: (id: string | null) => void;
}

export const useTestingLocationDialogStore = create<TestingLocationDialogStore>(
  (set) => ({
    isCreateDialogOpen: false,
    setIsCreateDialogOpen: (isOpen: boolean) =>
      set({ isCreateDialogOpen: isOpen }),
    isEditDialogOpen: false,
    setIsEditDialogOpen: (isOpen: boolean) => set({ isEditDialogOpen: isOpen }),
    editingTestingLocationId: null,
    setEditingTestingLocationId: (id: string | null) =>
      set({ editingTestingLocationId: id }),
  }),
);
