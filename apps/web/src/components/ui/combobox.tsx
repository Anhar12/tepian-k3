import { useCallback, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

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

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {selectedOption?.name || placeholder}
          <ChevronsUpDown className="opacity-50" />
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
