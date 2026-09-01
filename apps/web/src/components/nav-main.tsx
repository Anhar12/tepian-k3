import { type Icon } from "@tabler/icons-react";
import { ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Permission } from "@tepian-k3/constants";
import React from "react";

export interface NavItem {
  title: string;
  url?: string;
  icon?: Icon;
  permission?: Permission | string;
  items?: {
    title: string;
    url: string;
    icon?: Icon;
    permission?: Permission | string;
  }[];
}

export interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Flatten items for active state calculation
  const allUrls = React.useMemo(() => {
    const urls: { url: string; isParent: boolean }[] = [];
    items.forEach((item) => {
      if (item.url) urls.push({ url: item.url, isParent: true });
      if (item.items) {
        item.items.forEach((subItem) => {
          urls.push({ url: subItem.url, isParent: false });
        });
      }
    });
    return urls;
  }, [items]);

  // Find the most specific matching item
  const activeItemUrl = React.useMemo(() => {
    return allUrls.reduce<string | null>((best, item) => {
      const itemUrlPath = item.url.split("?")[0] || "";
      const itemUrlParams = item.url.split("?")[1];

      let isMatch = false;
      if (itemUrlParams) {
        const currentSearchParams = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : "",
        );
        const targetSearchParams = new URLSearchParams(itemUrlParams);

        const paramsMatch = Array.from(targetSearchParams.entries()).every(
          ([key, val]) => currentSearchParams.get(key) === val,
        );

        isMatch = location.pathname === itemUrlPath && paramsMatch;
      } else {
        isMatch =
          location.pathname === item.url ||
          location.pathname.startsWith(`${item.url}/`);
      }

      if (isMatch && (!best || item.url.length > best.length)) {
        return item.url;
      }
      return best;
    }, null);
  }, [allUrls, location.pathname]);

  const [openItem, setOpenItem] = React.useState<string | null>(null);

  // Sync open state with active route
  React.useEffect(() => {
    const parentWithActiveItem = items.find(
      (item) =>
        item.items &&
        item.items.some((subItem) => activeItemUrl === subItem.url),
    );
    if (parentWithActiveItem) {
      setOpenItem(parentWithActiveItem.title);
    }
  }, [activeItemUrl, items]);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const hasSubMenu = item.items && item.items.length > 0;
            const isSubMenuActive =
              hasSubMenu &&
              item.items!.some((subItem) => activeItemUrl === subItem.url);

            if (!hasSubMenu && item.url) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => navigate({ to: item.url! })}
                    className={cn(
                      "flex h-12 w-full items-center gap-3.5 rounded-none text-sm transition-all duration-200",
                      activeItemUrl === item.url
                        ? "border-r-[3.5px] border-primary font-semibold text-primary hover:text-primary [&>svg]:stroke-[2px]"
                        : "bg-transparent text-slate-800 hover:bg-primary/10 hover:text-primary [&>svg]:stroke-[1.8px]",
                    )}
                  >
                    {item.icon && <item.icon className="size-5 shrink-0" />}
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            const isOpen = openItem === item.title;

            return (
              <Collapsible
                key={item.title}
                asChild
                open={isOpen}
                onOpenChange={(open) => setOpenItem(open ? item.title : null)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        "flex h-12 w-full items-center gap-3.5 rounded-none text-sm transition-all duration-200",
                        isSubMenuActive
                          ? "border-r-[3.5px] border-primary bg-transparent font-semibold text-primary hover:bg-primary/10 hover:text-primary [&>svg]:stroke-[2px]"
                          : "bg-transparent text-slate-800 hover:bg-primary/10 hover:text-primary [&>svg]:stroke-[1.8px]",
                      )}
                    >
                      {item.icon && <item.icon className="size-5 shrink-0" />}
                      <span className="truncate">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l-2 border-slate-600 px-2 py-1">
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              "h-10 cursor-pointer rounded-md text-sm font-normal text-slate-800 transition-all hover:bg-primary/10 hover:text-primary",
                              activeItemUrl === subItem.url &&
                                "bg-white/20 font-semibold text-primary hover:bg-white/20",
                            )}
                            onClick={() => navigate({ to: subItem.url })}
                          >
                            <span>
                              {subItem.icon && (
                                <subItem.icon className="mr-2 inline-block size-4 shrink-0 opacity-70" />
                              )}
                              {subItem.title}
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
