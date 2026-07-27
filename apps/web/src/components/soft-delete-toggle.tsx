import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoftDeleteToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function SoftDeleteToggle({
  checked,
  onCheckedChange,
  className,
}: SoftDeleteToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2",
        checked
          ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          : "text-muted-foreground",
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      {checked ? (
        <>
          <EyeOff className="size-4" />
          Sembunyikan Data Terhapus
        </>
      ) : (
        <>
          <Eye className="size-4" />
          Tampilkan Data Terhapus
        </>
      )}
    </Button>
  );
}
