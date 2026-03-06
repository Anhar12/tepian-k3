import {
  IconCertificate,
  IconClipboardList,
  IconDashboard,
  IconFileInvoice,
  IconFilePencil,
  IconTool,
} from "@tabler/icons-react";
import type { NavMainProps } from "@/components/nav-main";

const urlStarter = "/employee";

export const employeeMenu: {
  navMain: NavMainProps["items"];
} = {
  navMain: [
    {
      title: "Dasbor",
      url: urlStarter,
      icon: IconDashboard,
    },
    {
      title: "Lembar Kerja",
      url: `${urlStarter}/worksheets`,
      icon: IconClipboardList,
      permission: "worksheets.read",
    },
    {
      title: "Pengujian",
      url: `${urlStarter}/testings`,
      icon: IconFileInvoice,
      permission: "testing.view",
    },
    {
      title: "SPT Saya",
      url: `${urlStarter}/spt`,
      icon: IconFilePencil,
      // permission: "documents.read",
    },
    {
      title: "Sertifikasi",
      url: `${urlStarter}/certifications`,
      icon: IconCertificate,
      permission: "testing.view",
    },
    {
      title: "Manajemen Alat",
      url: `${urlStarter}/tools`,
      icon: IconTool,
      permission: "worksheet-tools.update",
    },
  ],
};
