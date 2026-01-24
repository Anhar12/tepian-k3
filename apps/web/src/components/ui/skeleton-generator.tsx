import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface SkeletonGeneratorProps {
  variant?:
    | "card"
    | "form"
    | "table"
    | "list"
    | "avatar"
    | "text"
    | "textArea"
    | "input"
    | "button"
    | "companyForm"
    | "userForm"
    | "parameterForm"
    | "imageUpload"
    | "locationSelector"
    | "sectionHeader"
    | "radioGroup"
    | "tabbedContent"
    | "tabs"
    | "combobox"
    | "custom";
  count?: number;
  className?: string;
  children?: React.ReactNode;
  tabs?: number;
}

export function SkeletonGenerator({
  variant = "card",
  count = 1,
  className,
  children,
  tabs = 2,
}: SkeletonGeneratorProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return <SkeletonCard className={className} />;
      case "form":
        return <SkeletonForm className={className} />;
      case "table":
        return <SkeletonTable className={className} />;
      case "list":
        return <SkeletonList className={className} />;
      case "avatar":
        return <SkeletonAvatar className={className} />;
      case "text":
        return <SkeletonText className={className} />;
      case "button":
        return <SkeletonButton className={className} />;
      case "input":
        return <SkeletonInput className={className} />;
      case "textArea":
        return <SkeletonTextArea className={className} />;
      case "companyForm":
        return <SkeletonCompanyForm className={className} />;
      case "userForm":
        return <SkeletonUserForm className={className} />;
      case "parameterForm":
        return <SkeletonParameterForm className={className} />;
      case "imageUpload":
        return <SkeletonImageUpload className={className} />;
      case "locationSelector":
        return <SkeletonLocationSelector className={className} />;
      case "sectionHeader":
        return <SkeletonSectionHeader className={className} />;
      case "radioGroup":
        return <SkeletonRadioGroup className={className} />;
      case "tabbedContent":
        return <SkeletonTabbedContent className={className} />;
      case "tabs":
        return (
          <SkeletonTabs className={className} tabs={tabs}>
            {children}
          </SkeletonTabs>
        );
      case "combobox":
        return <SkeletonCombobox className={className} />;
      case "custom":
        return children;
      default:
        return <Skeleton className={className} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-lg border p-6", className)}>
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-4/5" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonTable({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("h-12 w-12 rounded-full", className)} />;
}

export function SkeletonText({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonInput({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className={cn("h-10 w-full rounded-md", className)} />
    </div>
  );
}

export function SkeletonTextArea({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2")}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className={cn("h-20 w-full rounded-md", className)} />
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-24 rounded-md", className)} />;
}

export function SkeletonCompanyForm({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Company Logo Section */}
      <div className="flex justify-start">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Image Upload */}
      <Skeleton className="h-20 w-full rounded-md" />

      {/* Name and Email Row */}
      <div className="flex flex-row gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Address Textarea */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Province, Regency, District, Village Grid */}
      <div className="flex flex-row flex-wrap justify-between gap-2">
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* KBLI */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* WLKP Section Header */}
      <div className="flex w-full flex-row gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      {/* WLKP Radio Group */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
        <div className="flex flex-row gap-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* WLKP Number Input */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Workers Data Section Header */}
      <div className="flex w-full flex-row gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>

      {/* Male and Female Workers Row */}
      <div className="flex flex-row gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Health Facility Radio Group */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-3 w-80" />
        <div className="flex flex-row gap-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Responsible Person Fields */}
      <div className="flex flex-row flex-wrap gap-2">
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-[49%] space-y-2">
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Submit Button */}
      <Skeleton className="mt-2 h-10 w-full rounded-md" />
    </div>
  );
}

export function SkeletonCombobox({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

export function SkeletonImageUpload({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
        <Skeleton className="mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mb-2 h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function SkeletonLocationSelector({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-row flex-wrap justify-between gap-2", className)}
    >
      <div className="w-[49%] space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="w-[49%] space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="w-[49%] space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="w-[49%] space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function SkeletonSectionHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-row gap-4", className)}>
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

export function SkeletonRadioGroup({
  className,
  options = 2,
}: {
  className?: string;
  options?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-64" />
      <div className="flex flex-row gap-4">
        {Array.from({ length: options }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTabbedContent({
  className,
  tabs = 3,
}: {
  className?: string;
  tabs?: number;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs List */}
      <div className="flex gap-2 border-b">
        {Array.from({ length: tabs }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-t-md" />
        ))}
      </div>
      {/* Tab Content */}
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonUserForm({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Name and Email Row */}
      <div className="flex flex-row gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Username and Password Row */}
      <div className="flex flex-row gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Multi-select Roles */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Company Selection */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Submit Button */}
      <Skeleton className="mt-2 h-10 w-full rounded-md" />
    </div>
  );
}

export function SkeletonParameterForm({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Name Field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Category and Type Row */}
      <div className="flex flex-row gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Value Field (Currency) */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Submit Button */}
      <Skeleton className="mt-2 h-10 w-full rounded-md" />
    </div>
  );
}

export function SkeletonTabs({
  className,
  tabs = 2,
  children,
}: {
  className?: string;
  tabs?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs List - matches shadcn tabs styling */}
      <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {Array.from({ length: tabs }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-8 rounded-md px-3",
              index === 0 ? "w-32" : "w-28",
              index < tabs - 1 ? "mr-1" : "",
            )}
          />
        ))}
      </div>
      {/* Tab Content */}
      {children ? (
        children
      ) : (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}
    </div>
  );
}
