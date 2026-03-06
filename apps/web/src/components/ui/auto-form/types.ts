import type {
  ControllerFieldState,
  ControllerRenderProps,
} from "react-hook-form";
import type { Permission } from "@tepian-k3/constants";
import type { z } from "zod";

export type InferredFieldType =
  | "combobox"
  | "text"
  | "email"
  | "url"
  | "number"
  | "textarea"
  | "checkbox"
  | "select"
  | "date";

export type FieldOverride = {
  label?: string;
  placeholder?: string;
  description?: string;
  hidden?: boolean;
  disabled?: boolean;
  component?: InferredFieldType;
  inputType?: string;
  isLoading?: boolean;
  options?: { label: string; value: string }[];
  render?: (props: {
    field: ControllerRenderProps;
    fieldState: ControllerFieldState;
  }) => React.ReactNode;
  permission?: Permission | Permission[];
  requireAll?: boolean;
};

export type AutoFormProps<T extends z.ZodObject<z.ZodRawShape>> = {
  schema: T;
  onSubmit: (data: z.infer<T>) => void;
  isPending?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<z.infer<T>>;
  fieldOverrides?: Partial<Record<keyof z.infer<T>, FieldOverride | false>>;
  fieldOrder?: (keyof z.infer<T>)[];
  hideFields?: (keyof z.infer<T>)[];
  className?: string;
};

export type FieldConfig = {
  name: string;
  type: InferredFieldType;
  enumValues?: string[];
  isOptional: boolean;
  override?: FieldOverride;
};
