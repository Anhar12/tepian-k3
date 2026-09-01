import { type OrderStatus } from "@tepian-k3/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ORDER_STATUS_AWAM_MAP: Record<
  OrderStatus,
  { label: string; colorClass: string }
> = {
  pending: {
    label: "Pending",
    colorClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  kaji_ulang: {
    label: "Kaji Ulang",
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  kaji_ulang_disetujui: {
    label: "Disetujui",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  penawaran_review: {
    label: "Menyiapkan Penawaran",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  penawaran_diterbitkan: {
    label: "Penawaran Sudah Siap",
    colorClass: "bg-green-100 text-green-700 border-green-200",
  },
  revision: {
    label: "Revisi",
    colorClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  upload_surat_persetujuan: {
    label: "Harap Upload Surat Persetujuan",
    colorClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  surat_persetujuan_diproses: {
    label: "Surat Persetujuan Diproses",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  persetujuan_disetujui: {
    label: "Persetujuan Diterima",
    colorClass: "bg-green-100 text-green-700 border-green-200",
  },
  tagihan_diterbitkan: {
    label: "Tagihan Sudah Tersedia",
    colorClass: "bg-green-100 text-green-700 border-green-200",
  },
  proses_validasi_pembayaran: {
    label: "Pembayaran Sedang Diverifikasi",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  pembayaran_diterima: {
    label: "Pembayaran Berhasil",
    colorClass: "bg-green-100 text-green-700 border-green-200",
  },
  menunggu_penerbitan_spt_jadwal: {
    label: "Menyiapkan Jadwal Pengujian",
    colorClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  proses_pengambilan_sampel: {
    label: "Proses Pengambilan Sampel",
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  sampel_dalam_proses_penyerahan: {
    label: "Sampel Dibawa ke Lab",
    colorClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  sampel_telah_dianalisis: {
    label: "Sampel Sedang Dianalisis",
    colorClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  sampel_selesai_dianalisis: {
    label: "Analisis Selesai",
    colorClass: "bg-green-100 text-green-700 border-green-200",
  },
  laporan_diterbitkan: {
    label: "Laporan Diterbitkan",
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Selesai",
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    colorClass: "bg-red-100 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Dibatalkan",
    colorClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

interface StatusBadgeAwamProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadgeAwam({ status, className }: StatusBadgeAwamProps) {
  const config = ORDER_STATUS_AWAM_MAP[status] || {
    label: status,
    colorClass: "bg-gray-100 text-gray-700",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.colorClass,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
