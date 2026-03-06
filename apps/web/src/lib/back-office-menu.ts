import {
  IconBook,
  IconBriefcase,
  IconCategory,
  IconCategoryPlus,
  IconDashboard,
  IconFileInvoice,
  IconFlask,
  IconHistory,
  IconLayersSubtract,
  IconMessage2Question,
  IconShoppingCart,
  IconTools,
  IconUserPlus,
  IconUsers,
  IconUserShield,
  IconAd,
  IconNews,
  IconHash,
} from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/back-office";

export const backOfficeMenu: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dasbor",
      url: urlStarter,
      icon: IconDashboard,
    },
    {
      title: "Pesanan",
      url: `${urlStarter}/orders`,
      icon: IconShoppingCart,
      permission: "orders.view",
    },
    {
      title: "Lembar Kerja",
      url: `${urlStarter}/worksheets`,
      icon: IconFileInvoice,
      permission: "worksheets.view",
    },
    {
      title: "Pengujian",
      url: `${urlStarter}/testings`,
      icon: IconFileInvoice,
      permission: "testing.view",
    },
    {
      title: "Pengguna",
      url: `${urlStarter}/users`,
      icon: IconUsers,
      permission: "users.view",
    },
    {
      title: "Jabatan",
      url: `${urlStarter}/positions`,
      icon: IconBriefcase,
      permission: "positions.view",
    },
    {
      title: "Pegawai",
      url: `${urlStarter}/employees`,
      icon: IconUserShield,
      permission: "employees.view",
    },
    {
      title: "Peran",
      url: `${urlStarter}/roles`,
      icon: IconUserPlus,
      permission: "roles.view",
    },
    {
      title: "Klaster",
      url: `${urlStarter}/clusters`,
      icon: IconLayersSubtract,
      permission: "clusters.view",
    },
    {
      title: "Kategori Parameter",
      url: `${urlStarter}/parameter-categories`,
      icon: IconCategory,
      permission: "parameter-categories.view",
    },
    {
      title: "Parameter",
      url: `${urlStarter}/parameters`,
      icon: IconCategoryPlus,
      permission: "parameters.view",
    },
    {
      title: "Kode Alat",
      url: `${urlStarter}/tool-codes`,
      icon: IconHash,
      permission: "tool-codes.view",
    },
    {
      title: "Alat",
      url: `${urlStarter}/tools`,
      icon: IconTools,
      permission: "tools.view",
    },
    {
      title: "Bahan Kimia",
      url: `${urlStarter}/chemical-materials`,
      icon: IconFlask,
      permission: "chemical-materials.view",
    },
    {
      title: "KBLI",
      url: `${urlStarter}/kblis`,
      icon: IconBook,
      permission: "kbli.view",
    },
    {
      title: "Survei",
      url: `${urlStarter}/survey-questions`,
      icon: IconMessage2Question,
      permission: "survey-questions.view",
    },
    {
      title: "Spanduk",
      url: `${urlStarter}/banners`,
      icon: IconAd,
      permission: "banners.view",
    },
    {
      title: "Berita",
      url: `${urlStarter}/news`,
      icon: IconNews,
      permission: "news.view",
    },
    {
      title: "Log Audit",
      url: `${urlStarter}/audits`,
      icon: IconHistory,
      permission: "audits.view",
    },
  ],
};
