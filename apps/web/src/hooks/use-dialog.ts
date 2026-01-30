import { useState, useCallback } from "react";
import { z } from "zod";

/**
 * The `useDialogs` function in TypeScript creates a customizable dialog management system with
 * optional validation capabilities based on provided schemas.
 * @param {T} schemas - The `schemas` parameter can be either:
 * 1. A Zod schema for dialogs that need validation
 * 2. `null` or `undefined` for simple dialogs that only need open/close state
 *
 * IMPORTANT NOTE: use as constant when passing zod schemas to preserve literal types
 * EXAMPLE:
 * ```ts
 * const dialogs = useDialogs({
 *   // Dialog with validation
 *   showAlert: z.object({
 *     title: z.string().min(1, "Title is required"),
 *     message: z.string().min(1, "Message is required"),
 *   }),
 *   // Simple dialog without validation
 *   confirmDelete: null,
 *   simpleModal: null,
 * } as const);
 * ```
 */
const useDialogs = <T extends Record<string, z.ZodType | null>>(schemas: T) => {
  type DialogConfig = {
    [K in keyof T]: T[K] extends z.ZodType ? z.infer<T[K]> : never;
  };
  type DialogName = keyof T;
  type DialogWithData = {
    [K in DialogName]: T[K] extends z.ZodType ? K : never;
  }[DialogName];
  type DialogWithoutData = {
    [K in DialogName]: T[K] extends null ? K : never;
  }[DialogName];

  const [state, setState] = useState<{
    [K in DialogName]?: {
      isOpen: boolean;
      data?: DialogConfig[K];
      errors?: Partial<Record<keyof DialogConfig[K], string>>;
      isValid?: boolean;
    };
  }>({});

  // Helper to create default data from schema
  const getDefaultData = useCallback(
    <K extends DialogWithData>(name: K): DialogConfig[K] => {
      const schema = schemas[name];
      if (!schema) return {} as DialogConfig[K];

      // Try to parse an empty object to get defaults
      const result = schema.safeParse({});
      if (result.success) {
        return result.data as DialogConfig[K];
      }

      // If that fails, create a basic default based on schema shape
      if ("shape" in schema && schema.shape) {
        const defaults: Record<string, unknown> = {};
        Object.keys(schema.shape).forEach((key) => {
          const fieldSchema = (schema.shape as Record<string, z.ZodTypeAny>)[key];
          if (!fieldSchema) {
            defaults[key] = undefined;
            return;
          }

          if (fieldSchema instanceof z.ZodString) {
            defaults[key] = "";
          } else if (fieldSchema instanceof z.ZodNumber) {
            defaults[key] = 0;
          } else if (fieldSchema instanceof z.ZodBoolean) {
            defaults[key] = false;
          } else if (fieldSchema instanceof z.ZodArray) {
            defaults[key] = [];
          } else if (fieldSchema instanceof z.ZodObject) {
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

  // Overload signatures
  function open<K extends DialogWithoutData>(name: K): void;
  function open<K extends DialogWithData>(
    name: K,
    data?: Partial<DialogConfig[K]>,
  ): void;
  function open<K extends DialogName>(
    name: K,
    data?: Partial<DialogConfig[K]>,
  ): void {
    const schema = schemas[name];

    if (schema === null) {
      // Simple dialog without data
      setState((prev) => ({
        ...prev,
        [name]: {
          isOpen: true,
        },
      }));
    } else {
      // Dialog with data and validation
      const defaultData = getDefaultData(name as unknown as DialogWithData);
      const finalData = data
        ? Object.assign({}, defaultData, data)
        : defaultData;

      setState((prev) => ({
        ...prev,
        [name]: {
          isOpen: true,
          data: finalData as DialogConfig[K],
          errors: {},
          isValid: false,
        },
      }));
    }
  }

  const close = useCallback(<K extends DialogName>(name: K) => {
    setState((prev) => {
      const newState = { ...prev };
      delete newState[name];
      return newState;
    });
  }, []);

  const updateData = useCallback(
    <K extends DialogWithData>(
      name: K,
      updates: Partial<DialogConfig[K]>,
      validateOnChange = true,
    ) => {
      setState((prev) => {
        const currentDialog = prev[name];
        if (!currentDialog || !currentDialog.data) return prev;

        const newData = Object.assign(
          {},
          currentDialog.data,
          updates,
        ) as DialogConfig[K];

        let errors: Partial<Record<keyof DialogConfig[K], string>> = {};
        let isValid = true;

        if (validateOnChange && schemas[name]) {
          const result = schemas[name]!.safeParse(newData);

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
    <K extends DialogWithData>(
      name: K,
    ): { success: false } | { success: true; data: DialogConfig[K] } => {
      const currentDialog = state[name];
      if (!currentDialog || !currentDialog.data) return { success: false };

      const schema = schemas[name];
      if (!schema) return { success: false };

      const result = schema.safeParse(currentDialog.data);

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
    <K extends DialogWithData>(name: K) => {
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
    <K extends DialogWithData>(name: K): DialogConfig[K] | undefined => {
      return state[name]?.data;
    },
    [state],
  );

  const getErrors = useCallback(
    <K extends DialogWithData>(
      name: K,
    ): Partial<Record<keyof DialogConfig[K], string>> => {
      return (state[name]?.errors ?? {}) as Partial<
        Record<keyof DialogConfig[K], string>
      >;
    },
    [state],
  );

  const getFieldError = useCallback(
    <K extends DialogWithData>(
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
    <K extends DialogWithData>(name: K): boolean => {
      return state[name]?.isValid ?? false;
    },
    [state],
  );

  const clearErrors = useCallback(<K extends DialogWithData>(name: K) => {
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
