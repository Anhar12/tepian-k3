import {
  IconAdjustments,
  IconBook,
  IconBuilding,
  IconDashboard,
  IconFolderCog,
  IconLayersSubtract,
  IconShieldCheckFilled,
  IconTools,
  IconUsers,
} from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/back-office";

export const backOfficeMenu: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dashboard",
      url: urlStarter,
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: `${urlStarter}/users`,
      icon: IconUsers,
      permission: "users.read",
    },
    {
      title: "Tools",
      url: `${urlStarter}/tools`,
      icon: IconTools,
      permission: "tools.read",
    },
    {
      title: "Roles",
      url: `${urlStarter}/roles`,
      icon: IconShieldCheckFilled,
      permission: "roles.read",
    },
    {
      title: "Clusters",
      url: `${urlStarter}/clusters`,
      icon: IconLayersSubtract,
      permission: "clusters.read",
    },
    {
      title: "Parameter Categories",
      url: `${urlStarter}/parameter-categories`,
      icon: IconFolderCog,
      permission: "parameter-categories.read",
    },
    {
      title: "Parameters",
      url: `${urlStarter}/parameters`,
      icon: IconAdjustments,
      permission: "parameters.read",
    },
    {
      title: "KBLIs",
      url: `${urlStarter}/kblis`,
      icon: IconBook,
      permission: "kbli.read",
    },
  ],
};
