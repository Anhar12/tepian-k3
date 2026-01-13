import { Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ButtonWithLoadingProps {
  className?: string;
  isLoading: boolean;
  text: string;
  onClick?: () => void;
}

export default function ButtonWithLoading({
  className,
  isLoading,
  text,
  onClick,
}: ButtonWithLoadingProps) {
  return (
    <Button
      className={cn("mt-2 h-10 w-full text-sm", className)}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {text}
    </Button>
  );
}
