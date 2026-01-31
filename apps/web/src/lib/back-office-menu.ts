import {
  IconBook,
  IconBriefcase,
  IconCategory,
  IconCategoryPlus,
  IconDashboard,
  IconFileInvoice,
  IconFlask,
  IconLayersSubtract,
  IconMessage2Question,
  IconShoppingCart,
  IconTools,
  IconUserPlus,
  IconUsers,
  IconUserShield,
  IconAd,
  IconNews,
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
      permission: "orders.view",
    },
    {
      title: "Worksheets",
      url: `${urlStarter}/worksheets`,
      icon: IconFileInvoice,
      permission: "worksheets.view",
    },
    {
      title: "Testings",
      url: `${urlStarter}/testings`,
      icon: IconFileInvoice,
      permission: "testing.view",
    },
    {
      title: "Users",
      url: `${urlStarter}/users`,
      icon: IconUsers,
      permission: "users.view",
    },
    {
      title: "Positions",
      url: `${urlStarter}/positions`,
      icon: IconBriefcase,
      permission: "positions.view",
    },
    {
      title: "Employees",
      url: `${urlStarter}/employees`,
      icon: IconUserShield,
      permission: "employees.view",
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
      title: "Chemical Materials",
      url: `${urlStarter}/chemical-materials`,
      icon: IconFlask,
      permission: "chemical-materials.view",
    },
    {
      title: "KBLIs",
      url: `${urlStarter}/kblis`,
      icon: IconBook,
      permission: "kbli.view",
    },
    {
      title: "Surveys",
      url: `${urlStarter}/survey-questions`,
      icon: IconMessage2Question,
      permission: "survey-questions.view",
    },
    {
      title: "Banners",
      url: `${urlStarter}/banners`,
      icon: IconAd,
      permission: "banners.view",
    },
    {
      title: "News",
      url: `${urlStarter}/news`,
      icon: IconNews,
      permission: "news.view",
    },
  ],
};
