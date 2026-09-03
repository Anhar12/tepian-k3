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
  IconDeviceLaptop,
  IconAward,
  IconVideo,
  IconSettings,
  IconLayoutGrid,
  IconFileText,
  IconUsersGroup,
} from "@tabler/icons-react";

const urlStarter = "/back-office";

export interface NavItem {
  title: string;
  url?: string;
  icon?: any;
  permission?: string;
  items?: {
    title: string;
    url: string;
    icon?: any;
    permission?: string;
  }[];
}

export const backOfficeMenu: {
  pengujian: NavItem[];
  pelatihan: NavItem[];
} = {
  pengujian: [
    {
      title: "Utama",
      icon: IconDashboard,
      items: [
        {
          title: "Dasbor",
          url: urlStarter,
          icon: IconDashboard,
        },
      ],
    },
    {
      title: "Operasional",
      icon: IconShoppingCart,
      items: [
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
      ],
    },
    {
      title: "Katalog",
      icon: IconLayersSubtract,
      items: [
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
          title: "Alat",
          url: `${urlStarter}/tools`,
          icon: IconTools,
          permission: "tools.view",
        },
        {
          title: "Kode Alat",
          url: `${urlStarter}/tool-codes`,
          icon: IconHash,
          permission: "tool-codes.view",
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
      ],
    },
    {
      title: "Kepegawaian",
      icon: IconUsers,
      items: [
        {
          title: "Pegawai",
          url: `${urlStarter}/employees`,
          icon: IconUserShield,
          permission: "employees.view",
        },
        {
          title: "Jabatan",
          url: `${urlStarter}/positions`,
          icon: IconBriefcase,
          permission: "positions.view",
        },
        {
          title: "Pengguna",
          url: `${urlStarter}/users`,
          icon: IconUsers,
          permission: "users.view",
        },
        {
          title: "Peran",
          url: `${urlStarter}/roles`,
          icon: IconUserPlus,
          permission: "roles.view",
        },
      ],
    },
    {
      title: "Utilitas",
      icon: IconSettings,
      items: [
        {
          title: "Manajemen Aset Halaman",
          url: `${urlStarter}/landing-settings`,
          icon: IconLayoutGrid,
          permission: "banners.view",
        },
        {
          title: "Manajemen PPID",
          url: `${urlStarter}/landing-settings?tab=ppid`,
          icon: IconFileText,
          permission: "ppid-submissions.read",
        },
        {
          title: "Survei",
          url: `${urlStarter}/survey-questions`,
          icon: IconMessage2Question,
          permission: "survey-questions.view",
        },
        {
          title: "Chatbot Asty",
          url: `${urlStarter}/chatbot`,
          icon: IconMessage2Question,
          permission: "banners.view",
        },
        {
          title: "Spanduk (Banner Hero)",
          url: `${urlStarter}/banners`,
          icon: IconAd,
          permission: "banners.view",
        },
        {
          title: "Tim Kami",
          url: `${urlStarter}/team-members`,
          icon: IconUsersGroup,
          permission: "banners.view",
        },
        {
          title: "Berita",
          url: `${urlStarter}/news`,
          icon: IconNews,
          permission: "news.view",
        },
        {
          title: "Media & Publikasi",
          url: `${urlStarter}/media-publications`,
          icon: IconNews,
          permission: "media-publications.view",
        },
        {
          title: "Log Audit",
          url: `${urlStarter}/audits`,
          icon: IconHistory,
          permission: "audits.view",
        },
        {
          title: "Import / Export",
          url: `${urlStarter}/pengujian/import-export`,
          icon: IconBook,
          permission: "pengujian-import-export.read",
        },
      ],
    },
  ],
  pelatihan: [
    {
      title: "Utama",
      icon: IconDashboard,
      items: [
        {
          title: "Dasbor",
          url: urlStarter,
          icon: IconDashboard,
        },
      ],
    },
    {
      title: "Program",
      icon: IconBook,
      items: [
        {
          title: "E-Learning",
          url: `${urlStarter}/pelatihan?type=elearning`,
          icon: IconDeviceLaptop,
          permission: "pelatihan.view",
        },
        {
          title: "Bimtek",
          url: `${urlStarter}/pelatihan?type=bimtek`,
          icon: IconAward,
          permission: "pelatihan.view",
        },
        {
          title: "Webinar",
          url: `${urlStarter}/pelatihan?type=webinar`,
          icon: IconVideo,
          permission: "pelatihan.view",
        },
      ],
    },
    {
      title: "Operasional",
      icon: IconShoppingCart,
      items: [
        {
          title: "Order Pelatihan",
          url: `${urlStarter}/order-pelatihan`,
          icon: IconShoppingCart,
          permission: "pelatihan.view",
        },
        {
          title: "Manajemen Absensi",
          url: `${urlStarter}/absensi`,
          icon: IconFileInvoice,
          permission: "pelatihan.view",
        },
        {
          title: "Sertifikat Pelatihan",
          url: `${urlStarter}/sertifikat-pelatihan`,
          icon: IconAward,
          permission: "pelatihan-certificates.read",
        },
      ],
    },
    {
      title: "Konten",
      icon: IconSettings,
      items: [
        {
          title: "Manajemen Aset Halaman",
          url: `${urlStarter}/landing-settings`,
          icon: IconLayoutGrid,
          permission: "banners.view",
        },
        {
          title: "Tim Kami",
          url: `${urlStarter}/team-members`,
          icon: IconUsersGroup,
          permission: "banners.view",
        },
        {
          title: "Media & Publikasi",
          url: `${urlStarter}/media-publications`,
          icon: IconNews,
          permission: "media-publications.view",
        },
        {
          title: "Chatbot Asty",
          url: `${urlStarter}/chatbot`,
          icon: IconMessage2Question,
          permission: "banners.view",
        },
      ],
    },
  ],
};
