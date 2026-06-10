import { type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Permission } from "@tepian-k3/constants";

export interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    permission?: Permission;
  }[];
}

export function NavMain({ items }: NavMainProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Find the most specific matching item (longest URL that matches, respecting search params)
  const activeItem = items.reduce<string | null>((best, item) => {
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

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => navigate({ to: item.url })}
                className={cn(
                  "flex h-12 w-full items-center gap-3.5 rounded-none text-sm transition-all duration-200",
                  activeItem === item.url
                    ? "border-l-[3.5px] border-white bg-[#1061d6] pr-6 pl-5 font-semibold text-white hover:bg-[#1061d6] hover:text-white [&>svg]:stroke-white [&>svg]:stroke-[2px] [&>svg]:text-white"
                    : "bg-transparent pr-6 pl-6 text-[#dce7ff] hover:bg-white/10 hover:text-white [&>svg]:stroke-[#dce7ff] [&>svg]:stroke-[1.8px] [&>svg]:text-[#dce7ff]",
                )}
              >
                {item.icon && <item.icon className="size-5 shrink-0" />}
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
