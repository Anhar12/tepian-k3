import { Beaker, CalendarDays, Receipt } from "lucide-react";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { getRouteApi } from "@tanstack/react-router";

const navItems: {
  tabs: string;
  label: string;
  shortLabel: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  {
    tabs: "parameter",
    label: "Parameter",
    shortLabel: "Parameter",
    icon: Beaker,
  },
  {
    tabs: "jadwal-personil",
    label: "Jadwal Personil",
    shortLabel: "Jadwal",
    icon: CalendarDays,
  },
  {
    tabs: "detail-transaksi",
    label: "Detail Transaksi",
    shortLabel: "Transaksi",
    icon: Receipt,
  },
];

type TabsEnum = "parameter" | "jadwal-personil" | "detail-transaksi";

export function WorksheetHeader() {
  const route = getRouteApi("/(core)/worksheets");
  const { tabs } = route.useSearch();

  const navigate = route.useNavigate();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Navigation */}
        <nav className="flex items-center gap-1 border-b border-border px-2 sm:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = tabs === item.tabs;
            return (
              <button
                key={item.tabs}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:text-sm",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
                onClick={() => {
                  navigate({
                    search: (old) => ({ ...old, tabs: item.tabs as TabsEnum }),
                  });
                }}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
