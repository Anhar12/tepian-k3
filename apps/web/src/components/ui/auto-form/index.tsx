import { useMemo } from "react";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { AutoFormField } from "./field-renderer";
import type { AutoFormProps, FieldConfig, FieldOverride } from "./types";
import {
  extractDefaultValue,
  extractEnumValues,
  inferFieldType,
  isZodOptional,
} from "./utils";

export type {
  AutoFormProps,
  FieldOverride,
  FieldConfig,
  InferredFieldType,
} from "./types";

export function AutoForm<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  onSubmit,
  isPending,
  submitLabel = "Submit",
  defaultValues,
  fieldOverrides,
  fieldOrder,
  hideFields,
  className,
}: AutoFormProps<T>) {
  const defaultHiddenFields: (keyof z.infer<T>)[] = [
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ];

  const fields = useMemo(() => {
    const shape = schema.shape as Record<string, z.ZodType>;
    const keys = (fieldOrder as string[]) ?? Object.keys(shape);

    return keys
      .filter((key) => key in shape)
      .filter((key) => fieldOverrides?.[key as keyof typeof fieldOverrides] !== false)
      .map<FieldConfig>((key) => {
        const zodType = shape[key]!;
        const rawOverride = fieldOverrides?.[key as keyof typeof fieldOverrides];
        const override = (rawOverride || undefined) as FieldOverride | undefined;
        return {
          name: key,
          type: inferFieldType(zodType),
          enumValues: extractEnumValues(zodType),
          isOptional: isZodOptional(zodType),
          override,
        };
      });
  }, [schema, fieldOverrides, fieldOrder]);

  const computedDefaults = useMemo(() => {
    const shape = schema.shape as Record<string, z.ZodType>;
    const defaults: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const val = extractDefaultValue(shape[key]!);
      if (val !== undefined) {
        defaults[key] = val;
      }
    }
    return { ...defaults, ...defaultValues } as DefaultValues<FieldValues>;
  }, [schema, defaultValues]);

  const isHiddenField = (fieldName: string) => {
    if (hideFields && hideFields.includes(fieldName as keyof z.infer<T>)) {
      return true;
    }
    if (defaultHiddenFields.includes(fieldName as keyof z.infer<T>)) {
      return true;
    }
    return false;
  };

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema) as unknown as ReturnType<typeof zodResolver>,
    defaultValues: computedDefaults,
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit(data as z.infer<T>))}
      className={cn("grid gap-4", className)}
    >
      <FieldGroup>
        {fields.map((fieldConfig) =>
          isHiddenField(fieldConfig.name) ? null : (
            <AutoFormField
              key={fieldConfig.name}
              {...fieldConfig}
              control={form.control}
            />
          ),
        )}

        <Button
          type="submit"
          className="mt-2 h-10 w-full text-sm"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
