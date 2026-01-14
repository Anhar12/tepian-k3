import {
  IconAdjustments,
  IconBook,
  IconBuilding,
  IconCategory,
  IconCategoryPlus,
  IconDashboard,
  IconFileInvoice,
  IconFolderCog,
  IconLayersSubtract,
  IconShieldCheckFilled,
  IconTools,
  IconUserPlus,
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
      title: "Worksheets",
      url: `${urlStarter}/worksheets`,
      icon: IconFileInvoice,
    },
    {
      title: "Users",
      url: `${urlStarter}/users`,
      icon: IconUsers,
      permission: "users.read",
    },
    {
      title: "Roles",
      url: `${urlStarter}/roles`,
      icon: IconUserPlus,
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
      icon: IconCategory,
      permission: "parameter-categories.read",
    },
    {
      title: "Parameters",
      url: `${urlStarter}/parameters`,
      icon: IconCategoryPlus,
      permission: "parameters.read",
    },
    {
      title: "Tools",
      url: `${urlStarter}/tools`,
      icon: IconTools,
      permission: "tools.read",
    },
    {
      title: "KBLIs",
      url: `${urlStarter}/kblis`,
      icon: IconBook,
      permission: "kbli.read",
    },
  ],
};
