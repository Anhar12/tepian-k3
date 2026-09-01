import {
  IconBuilding,
  IconDashboard,
  IconBook,
  IconReceipt,
  IconFlask,
  IconUser,
  IconUsers,
  IconVideo,
  IconAward,
  IconTestPipe,
  IconClipboardCheck,
  IconHistory,
} from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/dashboard";

export const userMenu: {
  pengujian: NavMainProps["items"];
  pelatihan: NavMainProps["items"];
} = {
  pengujian: [
    {
      title: "Dasbor Pengujian",
      url: urlStarter,
      icon: IconDashboard,
    },
    {
      title: "Data Perusahaan",
      url: `${urlStarter}/company`,
      icon: IconBuilding,
    },
    {
      title: "Transaksi Pengujian",
      icon: IconFlask,
      items: [
        {
          title: "Order Pengujian",
          url: `/pengujian`,
          icon: IconTestPipe,
        },
        {
          title: "Pesanan Pengujian",
          url: `/pengujian/transaksi`,
          icon: IconClipboardCheck,
        },
        {
          title: "Riwayat Pengujian",
          url: `/pengujian/riwayat`,
          icon: IconHistory,
        },
      ],
    },
  ],
  pelatihan: [
    {
      title: "Profil Saya",
      url: `${urlStarter}/pelatihan?tab=profil`,
      icon: IconUser,
    },
    {
      title: "E-Learning",
      url: `${urlStarter}/pelatihan?tab=e-learning`,
      icon: IconBook,
    },
    {
      title: "Bimtek",
      url: `${urlStarter}/pelatihan?tab=bimtek`,
      icon: IconUsers,
    },
    {
      title: "Webinar",
      url: `${urlStarter}/pelatihan?tab=webinar`,
      icon: IconVideo,
    },
    {
      title: "Sertifikat",
      url: `${urlStarter}/pelatihan?tab=sertifikat`,
      icon: IconAward,
    },
    {
      title: "Riwayat Transaksi",
      url: `${urlStarter}/pelatihan?tab=riwayat-transaksi`,
      icon: IconReceipt,
    },
  ],
};
