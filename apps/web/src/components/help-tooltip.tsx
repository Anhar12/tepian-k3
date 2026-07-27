import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  content: React.ReactNode;
  iconClassName?: string;
}

export function HelpTooltip({ content, iconClassName }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-full">
            <HelpCircle className={iconClassName || "h-4 w-4"} />
            <span className="sr-only">Bantuan</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm font-normal">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
