import { IconBuilding, IconDashboard } from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/dashboard";

export const userMenu: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dasbor",
      url: urlStarter,
      icon: IconDashboard,
    },

    {
      title: "Data Perusahaan",
      url: `${urlStarter}/company`,
      icon: IconBuilding,
    },
  ],
};
