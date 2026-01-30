import { Beaker, CalendarDays, Receipt } from "lucide-react";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { getRouteApi } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import type { Permission } from "@tepian-k3/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

const navItems: {
  href: string;
  location: string;
  tabs: string;
  label: string;
  shortLabel: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  permission: Permission;
}[] = [
  {
    href: "/worksheets/",
    location: "worksheets",
    tabs: "parameter",
    label: "Parameter",
    shortLabel: "Parameter",
    icon: Beaker,
    permission: "worksheets-parameters.read",
  },
  {
    href: "/worksheets/jadwal-personel",
    location: "jadwal-personel",
    tabs: "jadwal-personel",
    label: "Jadwal Personel",
    shortLabel: "Jadwal",
    icon: CalendarDays,
    permission: "worksheets-personnel-assignments.read",
  },
  {
    href: "/worksheets/detail-transaksi",
    location: "detail-transaksi",
    tabs: "detail-transaksi",
    label: "Detail Transaksi",
    shortLabel: "Transaksi",
    icon: Receipt,
    permission: "worksheets-transaction-details.read",
  },
];

export function WorksheetHeader() {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());
  const route = getRouteApi("/(core)/worksheets");
  const location = useLocation();
  const navigate = route.useNavigate();

  const filteredNavItems = navItems.filter((item) =>
    profile.permissions.includes(item.permission),
  );

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
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const cleanPath = location.pathname.replace(/\/$/, "") || "/";
            const segments = cleanPath.split("/").filter(Boolean);
            const isSegmentOnlyHasOnePart = segments.length === 1;
            const lastSegment = segments[segments.length - 1];

            const isActive =
              item.location === lastSegment ||
              (isSegmentOnlyHasOnePart &&
                item.location === segments[0] &&
                item.location === "worksheets");
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
                    to: item.href,
                    search: (old) => ({ ...old }),
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
