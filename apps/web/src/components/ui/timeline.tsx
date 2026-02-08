import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type React from "react";

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Timeline({ children, className, ...props }: TimelineProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function TimelineItem({ children, className, ...props }: TimelineItemProps) {
  return (
    <div
      className={cn(
        "relative flex gap-2 pb-6 last:pb-0 sm:gap-4 sm:pb-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {
  isLast?: boolean;
  variant?: "solid" | "dashed";
  color?: "blue" | "gray" | "green" | "yellow";
}

function TimelineConnector({
  isLast = false,
  variant = "dashed",
  color = "blue",
  className,
  ...props
}: TimelineConnectorProps) {
  if (isLast) return null;

  const colorStyles = {
    blue: "border-blue-400",
    gray: "border-muted-foreground/30",
    green: "border-emerald-400",
    yellow: "border-yellow-400",
  };

  return (
    <div
      className={cn(
        "absolute top-6 h-[calc(100%+1rem)] w-px border-l-2 sm:h-[calc(100%+1.5rem)]",
        variant === "dashed" ? "border-dashed" : "border-solid",
        colorStyles[color],
        className,
      )}
      {...props}
    />
  );
}

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "completed" | "current" | "pending" | "revision";
  size?: "sm" | "md" | "lg";
}

function TimelineDot({
  variant = "default",
  size = "md",
  className,
  ...props
}: TimelineDotProps) {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const innerSizeStyles = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const iconSizeStyles = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  if (variant === "completed") {
    return (
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-center rounded-full bg-emerald-500",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <Check
          className={cn("text-white", iconSizeStyles[size])}
          strokeWidth={3}
        />
      </div>
    );
  }

  if (variant === "current") {
    return (
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-center rounded-full bg-background",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn("rounded-full bg-blue-500", innerSizeStyles[size])}
        />
      </div>
    );
  }

  if (variant === "revision") {
    return (
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-yellow-500 bg-background",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn("rounded-full bg-yellow-500", innerSizeStyles[size])}
        />
      </div>
    );
  }

  if (variant === "pending") {
    return (
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-center rounded-full bg-background",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "rounded-full bg-muted-foreground/40",
            innerSizeStyles[size],
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "z-10 flex shrink-0 items-center justify-center rounded-full bg-background",
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <div className={cn("rounded-full bg-blue-500", innerSizeStyles[size])} />
    </div>
  );
}

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function TimelineContent({
  children,
  className,
  ...props
}: TimelineContentProps) {
  return (
    <div className={cn("min-w-0 flex-1 pt-0.5", className)} {...props}>
      {children}
    </div>
  );
}

interface TimelineHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function TimelineHeader({
  children,
  className,
  ...props
}: TimelineHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col items-end text-[10px] text-muted-foreground sm:w-20 sm:text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
};
