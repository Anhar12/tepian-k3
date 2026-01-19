ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'kaji_ulang', 'kaji_ulang_disetujui', 'penawaran_diterbitkan', 'revision', 'upload_surat_persetujuan', 'surat_persetujuan_diproses', 'persetujuan_disetujui', 'tagihan_diterbitkan', 'proses_validasi_pembayaran', 'pembayaran_diterima', 'menunggu_penerbitan_spt_jadwal', 'proses_pengambilan_sampel', 'sampel_dalam_proses_penyerahan', 'sampel_telah_dianalisis', 'sampel_selesai_dianalisis', 'laporan_diterbitkan', 'completed', 'rejected', 'cancelled');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";