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

  // Find the most specific matching item (longest URL that matches)
  const activeItem = items.reduce<string | null>((best, item) => {
    const isMatch =
      location.pathname === item.url ||
      location.pathname.startsWith(`${item.url}/`);
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
                  activeItem === item.url &&
                    "bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground",
                )}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
