import { create } from "zustand";

interface ParameterToolDialogStore {
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (isOpen: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  editingParameterToolId: string | null;
  setEditingParameterToolId: (id: string | null) => void;
}

export const useParameterToolDialogStore = create<ParameterToolDialogStore>(
  (set) => ({
    isCreateDialogOpen: false,
    setIsCreateDialogOpen: (isOpen: boolean) =>
      set({ isCreateDialogOpen: isOpen }),
    isEditDialogOpen: false,
    setIsEditDialogOpen: (isOpen: boolean) => set({ isEditDialogOpen: isOpen }),
    editingParameterToolId: null,
    setEditingParameterToolId: (id: string | null) =>
      set({ editingParameterToolId: id }),
  }),
);
