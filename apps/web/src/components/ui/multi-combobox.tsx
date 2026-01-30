import { useCallback, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Skeleton } from "./skeleton";
import { Badge } from "./badge";

interface MultiComboBoxProps {
  options: Array<{ id: string; name: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  isLoading?: boolean;
  maxDisplay?: number; // Maximum number of badges to display before showing count
}

function MultiComboBox({
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
  maxDisplay = 2,
}: MultiComboBoxProps) {
  const selectedOptions = useMemo(
    () => options?.filter((opt) => value.includes(opt.id)) || [],
    [options, value],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      const newValue = value.includes(optionId)
        ? value.filter((id) => id !== optionId)
        : [...value, optionId];
      onChange(newValue);
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (optionId: string, e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      onChange(value.filter((id) => id !== optionId));
    },
    [value, onChange],
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
            !value.length && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {selectedOptions.length === 0 ? (
              placeholder
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.id}
                    variant="secondary"
                    className="mr-1 gap-1"
                  >
                    {option.name}
                    <button
                      type="button"
                      className="ml-1 rounded-full ring-offset-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.id, e);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => handleRemove(option.id, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selectedOptions.length > maxDisplay && (
                  <Badge variant="secondary" className="mr-1">
                    +{selectedOptions.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
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
                      value.includes(option.id) ? "opacity-100" : "opacity-0",
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

export default MultiComboBox;
