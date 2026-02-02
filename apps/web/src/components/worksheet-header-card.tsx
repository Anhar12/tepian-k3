import { Activity } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface HeaderCardProps {
  title: string;
  subtitle: string;
  actionButton: {
    label: string;
    icon: React.ReactNode;
    className?: string;
    labelClassName?: string;
    variant: VariantProps<typeof buttonVariants>["variant"];
    size: VariantProps<typeof buttonVariants>["size"];
    onClick: () => void;
  }[];
}

export function WorksheetHeaderCard({
  title,
  subtitle,
  actionButton,
}: HeaderCardProps) {
  return (
    <Card className="overflow-hidden border-0 bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20 sm:h-14 sm:w-14">
              <Activity className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {actionButton.map((button, index) => (
              <Button
                key={index}
                variant={button.variant}
                size={button.size}
                className={cn("flex items-center gap-2", button.className)}
                onClick={button.onClick}
              >
                {button.icon}
                <span className={cn("hidden sm:inline", button.labelClassName)}>
                  {button.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorksheetHeaderCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden border-0 bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl sm:h-14 sm:w-14" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 sm:h-6" />
              <Skeleton className="h-3 w-56 sm:h-4" />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
