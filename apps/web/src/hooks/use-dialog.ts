import { useState, useCallback } from "react";
import { z } from "zod";

/**
 * The `useDialogs` function in TypeScript creates a customizable dialog management system with
 * validation capabilities based on provided schemas.
 * @param {T} schemas - The `schemas` parameter in the `useDialogs` function is an object that contains
 * IMPORTANT NOTE: use as constant when passing zod schemas to preserve literal types
 * EXAMPLE:
 * ```ts
 * const dialogSchemas = {
 * showAlert: z.object({
 * title: z.string().min(1, "Title is required"),
 * message: z.string().min(1, "Message is required"),
 * }),
 * confirmAction: z.object({
 * actionName: z.string().min(1, "Action name is required"),
 * }),
 * } as const;
 * const dialogs = useDialogs(dialogSchemas);
 * ```
 * Zod schemas for defining the shape and validation rules of data for different dialogs in your
 * application. Each key in the `schemas` object represents a dialog name, and the corresponding value
 * is a Zod schema that
 * @returns The `useDialogs` function returns an object containing the following functions:
 */
const useDialogs = <T extends Record<string, z.ZodType>>(schemas: T) => {
  type DialogConfig = {
    [K in keyof T]: z.infer<T[K]>;
  };
  type DialogName = keyof DialogConfig;

  const [state, setState] = useState<{
    [K in DialogName]?: {
      isOpen: boolean;
      data: DialogConfig[K];
      errors: Partial<Record<keyof DialogConfig[K], string>>;
      isValid: boolean;
    };
  }>({});

  // Helper to create default data from schema
  const getDefaultData = useCallback(
    <K extends DialogName>(name: K): DialogConfig[K] => {
      const schema = schemas[name];

      // Try to parse an empty object to get defaults
      const result = schema.safeParse({});
      if (result.success) {
        return result.data as DialogConfig[K];
      }

      // If that fails, create a basic default based on schema shape
      if ("shape" in schema && schema.shape) {
        const defaults: any = {};
        Object.keys(schema.shape).forEach((key) => {
          const fieldSchema = (schema.shape as any)[key];

          // Handle different zod types
          if (fieldSchema._def?.typeName === "ZodString") {
            defaults[key] = "";
          } else if (fieldSchema._def?.typeName === "ZodNumber") {
            defaults[key] = 0;
          } else if (fieldSchema._def?.typeName === "ZodBoolean") {
            defaults[key] = false;
          } else if (fieldSchema._def?.typeName === "ZodArray") {
            defaults[key] = [];
          } else if (fieldSchema._def?.typeName === "ZodObject") {
            defaults[key] = {};
          } else {
            defaults[key] = undefined;
          }
        });
        return defaults as DialogConfig[K];
      }

      // Fallback to empty object
      return {} as DialogConfig[K];
    },
    [schemas],
  );

  const open = useCallback(
    <K extends DialogName>(name: K, data?: Partial<DialogConfig[K]>) => {
      const defaultData = getDefaultData(name);
      const finalData = data
        ? Object.assign({}, defaultData, data)
        : defaultData;

      setState((prev) => ({
        ...prev,
        [name]: {
          isOpen: true,
          data: finalData as DialogConfig[K],
          errors: {},
          isValid: false, // Start as invalid to force validation
        },
      }));
    },
    [getDefaultData],
  );

  const close = useCallback(<K extends DialogName>(name: K) => {
    setState((prev) => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });
  }, []);

  const updateData = useCallback(
    <K extends DialogName>(
      name: K,
      updates: Partial<DialogConfig[K]>,
      validateOnChange = true,
    ) => {
      setState((prev) => {
        const currentDialog = prev[name];
        if (!currentDialog) return prev;

        const newData = Object.assign(
          {},
          currentDialog.data,
          updates,
        ) as DialogConfig[K];

        let errors: Partial<Record<keyof DialogConfig[K], string>> = {};
        let isValid = true;

        if (validateOnChange) {
          const result = schemas[name].safeParse(newData);

          if (!result.success) {
            errors = result.error.issues.reduce(
              (acc, err) => {
                const field = err.path[0] as keyof DialogConfig[K];
                return { ...acc, [field]: err.message };
              },
              {} as Partial<Record<keyof DialogConfig[K], string>>,
            );
            isValid = false;
          }
        }

        return {
          ...prev,
          [name]: {
            ...currentDialog,
            data: newData,
            errors,
            isValid,
          },
        };
      });
    },
    [schemas],
  );

  const validate = useCallback(
    <K extends DialogName>(
      name: K,
    ): { success: false } | { success: true; data: DialogConfig[K] } => {
      const currentDialog = state[name];
      if (!currentDialog) return { success: false };

      const result = schemas[name].safeParse(currentDialog.data);

      if (!result.success) {
        const errors = result.error.issues.reduce(
          (acc, err) => {
            const field = err.path[0] as keyof DialogConfig[K];
            return { ...acc, [field]: err.message };
          },
          {} as Partial<Record<keyof DialogConfig[K], string>>,
        );

        setState((prev) => ({
          ...prev,
          [name]: {
            ...currentDialog,
            errors,
            isValid: false,
          },
        }));

        return { success: false };
      }

      setState((prev) => ({
        ...prev,
        [name]: {
          ...currentDialog,
          errors: {},
          isValid: true,
        },
      }));

      return { success: true, data: result.data as DialogConfig[K] };
    },
    [state, schemas],
  );

  const reset = useCallback(
    <K extends DialogName>(name: K) => {
      const defaultData = getDefaultData(name);

      setState((prev) => {
        const currentDialog = prev[name];
        if (!currentDialog) return prev;

        return {
          ...prev,
          [name]: {
            ...currentDialog,
            data: defaultData,
            errors: {},
            isValid: false,
          },
        };
      });
    },
    [getDefaultData],
  );

  const getData = useCallback(
    <K extends DialogName>(name: K): DialogConfig[K] | undefined => {
      return state[name]?.data;
    },
    [state],
  );

  const getErrors = useCallback(
    <K extends DialogName>(
      name: K,
    ): Partial<Record<keyof DialogConfig[K], string>> => {
      return (state[name]?.errors ?? {}) as Partial<
        Record<keyof DialogConfig[K], string>
      >;
    },
    [state],
  );

  const getFieldError = useCallback(
    <K extends DialogName>(
      name: K,
      field: keyof DialogConfig[K],
    ): string | undefined => {
      return state[name]?.errors?.[field];
    },
    [state],
  );

  const isOpen = useCallback(
    <K extends DialogName>(name: K): boolean => {
      return state[name]?.isOpen ?? false;
    },
    [state],
  );

  const isValid = useCallback(
    <K extends DialogName>(name: K): boolean => {
      return state[name]?.isValid ?? false;
    },
    [state],
  );

  const clearErrors = useCallback(<K extends DialogName>(name: K) => {
    setState((prev) => {
      const currentDialog = prev[name];
      if (!currentDialog) return prev;

      return {
        ...prev,
        [name]: {
          ...currentDialog,
          errors: {},
          isValid: true,
        },
      };
    });
  }, []);

  return {
    open,
    close,
    updateData,
    validate,
    reset,
    getData,
    getErrors,
    getFieldError,
    isOpen,
    isValid,
    clearErrors,
  };
};

export default useDialogs;
