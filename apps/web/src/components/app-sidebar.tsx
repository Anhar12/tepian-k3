import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { backOfficeMenu } from "@/lib/back-office-menu";
import { userMenu } from "@/lib/user-menu";
import ImageWithFallback from "./image-with-fallback";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const hasUserRole = profile.roles.some((role) => role.name === "user");

  // Separate user dashboard and back office menus
  const filteredNavMain = React.useMemo(() => {
    // For regular users: only show user dashboard menu
    if (hasUserRole) {
      return userMenu.navMain;
    }

    // For back office users: only show back office menu items based on permissions
    const backOfficeItems = backOfficeMenu.navMain.filter(
      (item) =>
        !item.permission || profile.permissions.includes(item.permission),
    );

    return backOfficeItems;
  }, [hasUserRole, profile.permissions]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#" className="flex flex-row items-center justify-start">
                <ImageWithFallback
                  src="/assets/tepian-k3.png"
                  alt="Tepian K3 Icon"
                  className="size-6"
                />
                <span className="text-base font-semibold">Tepian K3</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
