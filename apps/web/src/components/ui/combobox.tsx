import { useCallback, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, type LucideIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Skeleton } from "./skeleton";

interface ComboBoxProps {
  options: Array<{ id: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  isLoading?: boolean;
  icon?: LucideIcon;
}

function ComboBox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  open,
  onOpenChange,
  disabled,
  invalid,
  className,
  isLoading = false,
  icon: Icon,
}: ComboBoxProps) {
  const selectedOption = useMemo(
    () => options?.find((opt) => opt.id === value),
    [options, value],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      onChange(optionId);
      onOpenChange(false);
    },
    [onChange, onOpenChange],
  );

  if (isLoading) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}

            <span className="truncate">
              {selectedOption?.name || placeholder}
            </span>
          </span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="popover-content-width-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />

          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  value={option.name}
                  key={option.id}
                  onSelect={() => handleSelect(option.id)}
                >
                  {option.name}

                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ComboBox;
