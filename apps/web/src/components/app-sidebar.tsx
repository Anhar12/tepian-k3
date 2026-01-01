import * as React from "react";
import {
  IconAdjustments,
  IconBook,
  IconBuilding,
  IconDashboard,
  IconFolderCog,
  IconInnerShadowTop,
  IconLayersSubtract,
  IconShieldCheckFilled,
  IconTools,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain, type NavMainProps } from "@/components/nav-main";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  // Use userMenu if user has 'user' role, otherwise use backOfficeMenu
  const hasUserRole = profile.roles.some((role) => role.name === "user");
  const menu = hasUserRole ? userMenu : backOfficeMenu;

  // Only filter by permissions for back office menu, user menu shows all items
  const filteredNavMain = hasUserRole
    ? menu.navMain
    : menu.navMain.filter(
        (item) =>
          !item.permission || profile.permissions.includes(item.permission),
      );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
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
