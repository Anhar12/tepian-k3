import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ActionPanelProps {
  title: string;
  description: ReactNode;
  actionButton?: ReactNode;
  type?: "warning" | "info" | "success";
  dismissible?: boolean;
  className?: string;
}

export function ActionPanel({
  title,
  description,
  actionButton,
  type = "warning",
  dismissible = false,
  className,
}: ActionPanelProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };

  const icons = {
    warning: <AlertCircle className="size-5 text-amber-600" />,
    info: <AlertCircle className="size-5 text-blue-600" />,
    success: <CheckCircle2 className="size-5 text-emerald-600" />,
  };

  return (
    <Card className={cn("border-l-4 shadow-sm relative", styles[type], className)}>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
      <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-shrink-0 mt-0.5 md:mt-0">{icons[type]}</div>
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold">{title}</h4>
          <div className="text-sm opacity-90">{description}</div>
        </div>
        {actionButton && (
          <div className="flex-shrink-0 mt-2 md:mt-0 w-full md:w-auto">
            {actionButton}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
