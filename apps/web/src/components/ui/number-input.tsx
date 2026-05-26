import * as React from "react";

import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "min" | "onChange"
> {
  min?: number;
  onChange?: (value: number) => void;
}

/**
 * A number input that clamps its value to a minimum of 0 (or a custom `min`).
 * Negative values and values below `min` are rejected on blur and on change.
 */
function NumberInput({
  className,
  min = 0,
  value,
  onChange,
  onBlur,
  ...props
}: NumberInputProps) {
  const clamp = (raw: string) => {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return min;
    return Math.max(min, parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clamped = clamp(e.target.value);
    onChange?.(clamped);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const clamped = clamp(e.target.value);
    onChange?.(clamped);
    onBlur?.(e);
  };

  return (
    <input
      type="number"
      min={min}
      data-slot="input"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { NumberInput };
export type { NumberInputProps };
