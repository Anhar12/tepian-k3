import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import type { FieldConfig } from "./types";
import { keyToLabel } from "./utils";
import ComboBox from "../combobox";

export function AutoFormField({
  name,
  type,
  enumValues,
  isOptional,
  override,
  control,
}: FieldConfig & { control: Control<FieldValues> }) {
  if (override?.hidden) return null;

  const label = override?.label ?? keyToLabel(name);
  const placeholder = override?.placeholder;
  const description = override?.description;
  const disabled = override?.disabled;

  const field = (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        if (override?.render) {
          return <>{override.render({ field, fieldState })}</>;
        }

        if (type === "checkbox") {
          return (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid}
              className="flex-row items-center gap-2 space-y-0"
            >
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              <div className="space-y-1">
                <FieldLabel className="text-sm font-bold">{label}</FieldLabel>
                {description && (
                  <FieldDescription>{description}</FieldDescription>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>
            </Field>
          );
        }

        if (override?.component === "combobox") {
          if (override?.options == null) {
            throw new Error(
              `Combobox field "${name}" requires "options" in field override.`,
            );
          }

          return (
            <ComboboxField
              field={field}
              fieldState={fieldState}
              label={label}
              placeholder={placeholder}
              description={description}
              disabled={disabled}
              isOptional={isOptional}
              isLoading={override.isLoading}
              options={override.options}
            />
          );
        }

        return (
          <Field data-invalid={fieldState.invalid} className="space-y-1">
            <FieldLabel className="ml-1 text-sm font-bold">
              {label}
              {isOptional && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (opsional)
                </span>
              )}
            </FieldLabel>

            {type === "select" ? (
              <SelectField
                field={field}
                fieldState={fieldState}
                placeholder={placeholder}
                disabled={disabled}
                enumValues={enumValues}
                options={override?.options}
              />
            ) : type === "date" ? (
              <DateField
                field={field}
                fieldState={fieldState}
                placeholder={placeholder}
                disabled={disabled}
              />
            ) : type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                className="min-h-24 text-sm"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
              />
            ) : type === "number" ? (
              <Input
                type="number"
                placeholder={placeholder}
                className="h-10 text-sm"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? undefined : Number(val));
                }}
                aria-invalid={fieldState.invalid}
              />
            ) : (
              <Input
                type={override?.inputType ?? type}
                placeholder={placeholder}
                className="h-10 text-sm"
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
              />
            )}

            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );

  if (override?.permission) {
    return (
      <PermissionGate
        permission={override.permission}
        requireAll={override.requireAll}
      >
        {field}
      </PermissionGate>
    );
  }

  return field;
}

function SelectField({
  field,
  fieldState,
  placeholder,
  disabled,
  enumValues,
  options,
}: {
  field: ControllerRenderProps;
  fieldState: ControllerFieldState;
  placeholder?: string;
  disabled?: boolean;
  enumValues?: string[];
  options?: { label: string; value: string }[];
}) {
  const items =
    options ?? enumValues?.map((v) => ({ label: keyToLabel(v), value: v }));

  return (
    <Select
      value={field.value ?? ""}
      onValueChange={field.onChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-10 text-sm" aria-invalid={fieldState.invalid}>
        <SelectValue placeholder={placeholder ?? "Pilih..."} />
      </SelectTrigger>
      <SelectContent>
        {items?.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ComboboxField({
  field,
  fieldState,
  label,
  placeholder,
  description,
  disabled,
  isOptional,
  isLoading,
  options,
}: {
  field: ControllerRenderProps;
  fieldState: ControllerFieldState;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  isOptional: boolean;
  isLoading?: boolean;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Field data-invalid={fieldState.invalid} className="space-y-1">
      <FieldLabel className="ml-1 text-sm font-bold">
        {label}
        {isOptional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (opsional)
          </span>
        )}
      </FieldLabel>
      <ComboBox
        open={open}
        onOpenChange={setOpen}
        value={field.value ?? ""}
        onChange={field.onChange}
        isLoading={isLoading}
        options={options.map((opt) => ({
          id: opt.value,
          name: opt.label,
        }))}
        emptyMessage="Data tidak ditemukan"
        placeholder={placeholder ?? `Pilih ${label}...`}
        disabled={disabled}
        invalid={fieldState.invalid}
        searchPlaceholder="Cari..."
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}

function DateField({
  field,
  fieldState,
  placeholder,
  disabled,
}: {
  field: ControllerRenderProps;
  fieldState: ControllerFieldState;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left text-sm font-normal",
            !field.value && "text-muted-foreground",
          )}
          aria-invalid={fieldState.invalid}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value
            ? format(field.value, "dd/MM/yyyy")
            : (placeholder ?? "Pilih tanggal...")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value}
          onSelect={field.onChange}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
