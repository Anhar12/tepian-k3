import type userCompanySchema from "@tepian-k3/schema/user-company.schema";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import z from "zod";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const step2Schema = z.array(
  z.object({
    id: z.uuidv7(),
    name: z.string(),
    items: z.array(orderItemSchema.createOrderItemSchema),
  }),
);

const step3Schema = z.object({
  orderId: z.uuidv7(),
  orderNumber: z.string(),
});

const step4Schema = z.object({
  testingId: z.uuidv7(),
  testingNumber: z.string(),
});

interface TestingFormStore {
  currentStep: number;
  currentSelectedCompanyId?: string;
  currentSelectedLocationId?: string;
  formData: {
    step1?: z.infer<typeof userCompanySchema.createUserCompanySchema>;
    step2?: z.infer<typeof step2Schema>;
    step3?: z.infer<typeof step3Schema>;
    step4?: z.infer<typeof step4Schema>;
  };
  setCurrentStep: (step: number) => void;
  setStep1Data: (
    data: z.infer<typeof userCompanySchema.createUserCompanySchema>,
  ) => void;
  setStep2Data: (data: z.infer<typeof step2Schema>) => void;
  setStep3Data: (data: z.infer<typeof step3Schema>) => void;
  setStep4Data: (data: z.infer<typeof step4Schema>) => void;
  addItemToStep2: (
    locationId: string,
    item: z.infer<typeof orderItemSchema.createOrderItemSchema>,
  ) => void;
  reset: () => void;
}

export const useTestingFormStore = create<TestingFormStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      currentSelectedCompanyId: undefined,
      currentSelectedLocationId: undefined,
      formData: {},
      setCurrentStep: (step) => set({ currentStep: step }),
      setStep1Data: (data) =>
        set((state) => ({
          formData: { ...state.formData, step1: data },
          currentSelectedCompanyId: data.id,
        })),
      setStep2Data: (data) => {
        // first check if the location already exists in step2 if it does, do not add it again if not, add it

        const existingLocations = get().formData.step2 || [];

        const locationExists = existingLocations.some(
          (loc) => loc.id === data[0].id,
        );

        if (locationExists) {
          set({ currentSelectedLocationId: data[0].id });
          return;
        } else {
          set((state) => ({
            formData: {
              ...state.formData,
              step2: [...existingLocations, ...data],
            },
            currentSelectedLocationId: data[0].id,
          }));
        }
      },
      setStep3Data: (data) =>
        set((state) => ({ formData: { ...state.formData, step3: data } })),
      setStep4Data: (data) =>
        set((state) => ({ formData: { ...state.formData, step4: data } })),
      addItemToStep2: (locationId, item) =>
        set((state) => {
          const step2Data = state.formData.step2 || [];
          const updatedStep2Data = step2Data.map((location) => {
            if (location.id === locationId) {
              return {
                ...location,
                items: [...location.items, item],
              };
            }
            return location;
          });
          return {
            formData: {
              ...state.formData,
              step2: updatedStep2Data,
            },
            currentSelectedLocationId: locationId, // Add this
          };
        }),
      reset: () =>
        set({
          currentStep: 1,
          currentSelectedCompanyId: undefined, // Add this
          currentSelectedLocationId: undefined, // Add this
          formData: {},
        }),
    }),
    {
      name: "testing-form-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
