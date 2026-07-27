import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { useMaskedData } from "@/hooks/use-masked-data";

export interface MaskedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string | null | undefined;
  maskType: "email" | "phone" | "name" | "company";
  allowToggle?: boolean;
}

export const MaskedText = React.forwardRef<HTMLSpanElement, MaskedTextProps>(
  ({ value, maskType, allowToggle = true, className, ...props }, ref) => {
    const { displayValue, isMasked, toggleMask, canToggle } = useMaskedData(value, maskType, allowToggle);

    return (
      <span className={`inline-flex items-center gap-1.5 ${className || ""}`} ref={ref} {...props}>
        <span className="truncate" title={value || ""}>{displayValue}</span>
        {canToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0 text-slate-400 hover:text-slate-700"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMask();
            }}
            title={isMasked ? "Lihat Data Asli" : "Sembunyikan Data"}
          >
            {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        )}
      </span>
    );
  }
);
MaskedText.displayName = "MaskedText";
