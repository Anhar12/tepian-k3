import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { useMaskedData } from "@/hooks/use-masked-data";

export interface MaskableInputProps extends Omit<React.ComponentProps<"input">, "value"> {
  value: string | null | undefined;
  maskType: "email" | "phone" | "name" | "company";
  allowToggle?: boolean;
}

export const MaskableInput = React.forwardRef<HTMLInputElement, MaskableInputProps>(
  ({ value, maskType, allowToggle = true, className, ...props }, ref) => {
    const { displayValue, isMasked, toggleMask, canToggle } = useMaskedData(value, maskType, allowToggle);

    return (
      <div className="relative flex items-center">
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          className={`${className || ""} ${canToggle ? "pr-10" : ""}`}
          readOnly // Masked inputs are usually read-only unless toggled, but here we just pass props
        />
        {canToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full px-3 py-2 text-slate-400 hover:text-slate-700"
            onClick={toggleMask}
            title={isMasked ? "Lihat Data Asli" : "Sembunyikan Data"}
          >
            {isMasked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  }
);
MaskableInput.displayName = "MaskableInput";
