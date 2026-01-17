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
  IconShoppingCart,
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
      title: "Orders",
      url: `${urlStarter}/orders`,
      icon: IconShoppingCart,
      permission: "orders.read",
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
      permission: "users.view",
    },
    {
      title: "Roles",
      url: `${urlStarter}/roles`,
      icon: IconUserPlus,
      permission: "roles.view",
    },
    {
      title: "Clusters",
      url: `${urlStarter}/clusters`,
      icon: IconLayersSubtract,
      permission: "clusters.view",
    },
    {
      title: "Parameter Categories",
      url: `${urlStarter}/parameter-categories`,
      icon: IconCategory,
      permission: "parameter-categories.view",
    },
    {
      title: "Parameters",
      url: `${urlStarter}/parameters`,
      icon: IconCategoryPlus,
      permission: "parameters.view",
    },
    {
      title: "Tools",
      url: `${urlStarter}/tools`,
      icon: IconTools,
      permission: "tools.view",
    },
    {
      title: "KBLIs",
      url: `${urlStarter}/kblis`,
      icon: IconBook,
      permission: "kbli.view",
    },
  ],
};
