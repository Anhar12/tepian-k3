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
      className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {
  isLast?: boolean;
  variant?: "solid" | "dashed";
  color?: "blue" | "gray" | "green";
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
  };

  return (
    <div
      className={cn(
        "absolute top-6 h-10 w-px border-l-2",
        variant === "dashed" ? "border-dashed" : "border-solid",
        colorStyles[color],
        className,
      )}
      {...props}
    />
  );
}

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "completed" | "current" | "pending";
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
          "flex shrink-0 items-center justify-center rounded-full bg-emerald-500",
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
          "flex shrink-0 items-center justify-center",
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

  if (variant === "pending") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
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
        "flex shrink-0 items-center justify-center",
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
    <div className={cn("flex-1 pt-0.5", className)} {...props}>
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
        "flex w-14 flex-col items-end text-sm text-muted-foreground",
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
