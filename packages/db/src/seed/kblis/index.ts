import { db } from "../../client";
import { kblis } from "../../schema";

type InsertKbli = typeof kblis.$inferInsert;

const generateKblis = (): InsertKbli[] => {
  const kblis: string[] = [
    "Pertanian, Kehutanan dan Perikanan",
    "Pertambangan dan Penggalian",
    "Industri Pengolahan",
    "Pengadaan Listrik, Gas, Uap/Air Panas Dan Udara Dingin",
    "Treatment Air, Treatment Air Limbah, Treatment dan Pemulihan Material Sampah, dan Aktivitas Remediasi",
    "Konstruksi",
    "Perdagangan Besar Dan Eceran; Reparasi Dan Perawatan Mobil Dan Sepeda Motor",
    "Pengangkutan dan Pergudangan",
    "Penyediaan Akomodasi Dan Penyediaan Makan Minum",
    "Informasi Dan Komunikasi",
    "Aktivitas Keuangan dan Asuransi",
    "Real Estate",
    "Aktivitas Profesional, Ilmiah Dan Teknis",
    "Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya",
    "Administrasi Pemerintahan, Pertahanan Dan Jaminan Sosial Wajib",
    "Pendidikan",
    "Aktivitas Kesehatan Manusia Dan Aktivitas Sosial",
    "Kesenian, Hiburan Dan Rekreasi",
    "Aktivitas Jasa Lainnya",
    "Aktivitas Rumah Tangga Sebagai Pemberi Kerja; Aktivitas Yang Menghasilkan Barang Dan Jasa Oleh Rumah Tangga yang Digunakan untuk Memenuhi Kebutuhan Sendiri",
    "Aktivitas Badan Internasional Dan Badan Ekstra Internasional Lainnya",
  ];

  return kblis.map((name) => ({ name }));
};

async function seedKblis() {
  const kblisData = generateKblis();

  await db.delete(kblis).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db.insert(kblis).values(kblisData).execute();

  console.log("✅ KBLIs have been seeded");
}

export default seedKblis;
