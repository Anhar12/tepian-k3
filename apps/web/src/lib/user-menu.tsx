import { IconBuilding, IconDashboard } from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/dashboard";

export const userMenu: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dashboard",
      url: urlStarter,
      icon: IconDashboard,
    },

    {
      title: "Company",
      url: `${urlStarter}/company`,
      icon: IconBuilding,
    },
  ],
};
