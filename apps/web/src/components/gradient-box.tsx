import { cn } from "@/lib/utils";

interface GradientBoxProps {
  className?: string;
  rounded?: boolean;
}

export default function GradientBox({
  className,
  rounded = false,
}: GradientBoxProps) {
  return (
    <span
      className={cn(
        "inline-block size-3.5 bg-linear-to-r from-accent-linear-1 to-accent-linear-2",
        rounded && "rounded-sm",
        className,
      )}
    />
  );
}
