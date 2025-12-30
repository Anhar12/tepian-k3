import * as React from "react";
import {
  IconAdjustments,
  IconBook,
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

const data: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconUsers,
      permission: "users.read",
    },
    {
      title: "Tools",
      url: "/dashboard/tools",
      icon: IconTools,
      permission: "tools.read",
    },
    {
      title: "Roles",
      url: "/dashboard/roles",
      icon: IconShieldCheckFilled,
      permission: "roles.read",
    },
    {
      title: "Clusters",
      url: "/dashboard/clusters",
      icon: IconLayersSubtract,
      permission: "clusters.read",
    },
    {
      title: "Parameter Categories",
      url: "/dashboard/parameter-categories",
      icon: IconFolderCog,
      permission: "parameter-categories.read",
    },
    {
      title: "Parameters",
      url: "/dashboard/parameters",
      icon: IconAdjustments,
      permission: "parameters.read",
    },
    {
      title: "KBLIs",
      url: "/dashboard/kblis",
      icon: IconBook,
      permission: "kbli.read",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const filteredNavMain = data.navMain.filter(
    (item) => !item.permission || profile.permissions.includes(item.permission),
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
