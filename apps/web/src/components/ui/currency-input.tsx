import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value"
> {
  value?: number;
  onChange?: (value: number) => void;
  ref?: React.Ref<HTMLInputElement>;
  className?: string;
}

export function CurrencyInput({
  value = 0,
  onChange,
  ref,
  className,
  ...props
}: CurrencyInputProps) {
  function formatCurrency(num: number): string {
    if (!num) return "";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  }

  function parseValue(formatted: string): number {
    const cleaned = formatted.replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseValue(e.target.value);
    onChange?.(numericValue);
  };

  const displayValue = formatCurrency(value);

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={cn("text-right", className)}
    />
  );
}
