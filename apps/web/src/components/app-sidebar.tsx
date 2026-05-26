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
import { backOfficeMenu } from "@/lib/back-office-menu";
import { employeeMenu } from "@/lib/employee-menu";
import { userMenu } from "@/lib/user-menu";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";
import * as React from "react";
import ImageWithFallback from "./image-with-fallback";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnBackOffice = pathname.startsWith("/back-office");

  const roleNames = profile.roles.map((role) => role.name);
  const hasUserRole = roleNames.includes("user");
  const hasEmployeeRole = roleNames.some((name) =>
    (EMPLOYEE_ROLES as readonly string[]).includes(name),
  );
  const hasBackOfficeRole =
    isOnBackOffice ||
    roleNames.some((name) =>
      (BACK_OFFICE_ROLES as readonly string[]).includes(name),
    );

  // A user may have multiple roles — collect items from all applicable menus
  // and deduplicate by URL so overlapping items don't appear twice.
  // When on /back-office/* routes, back-office menu takes priority over employee menu.
  const filteredNavMain = React.useMemo(() => {
    const seen = new Set<string>();
    const items: (typeof userMenu.navMain)[number][] = [];

    const push = (candidate: (typeof userMenu.navMain)[number]) => {
      if (!seen.has(candidate.url)) {
        seen.add(candidate.url);
        items.push(candidate);
      }
    };

    if (hasUserRole) {
      userMenu.navMain.forEach(push);
    }

    if (hasEmployeeRole && !isOnBackOffice) {
      employeeMenu.navMain
        .filter(
          (item) =>
            !item.permission || profile.permissions.includes(item.permission),
        )
        .forEach(push);
    }

    if (hasBackOfficeRole) {
      backOfficeMenu.navMain
        .filter(
          (item) =>
            !item.permission || profile.permissions.includes(item.permission),
        )
        .forEach(push);
    }

    return items;
  }, [
    hasUserRole,
    hasEmployeeRole,
    hasBackOfficeRole,
    isOnBackOffice,
    profile.permissions,
  ]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/" className="flex flex-row items-center justify-start">
                <ImageWithFallback
                  src="/assets/tepian-k3.webp"
                  alt="Tepian K3 Icon"
                  className="size-6"
                />
                <span className="text-base font-semibold">Tepian K3</span>
              </Link>
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
