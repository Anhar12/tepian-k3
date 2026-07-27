# Peta Domain & Fitur (Domain Map)

Sistem `tepian-k3` menggunakan arsitektur **Modular Monolith** dengan tRPC. Fitur dikelompokkan ke dalam tiga domain utama: `platform`, `pengujian`, dan `pelatihan`.

> **Aturan Impor Penting**: 
> - `platform` tidak boleh mengimpor dari domain mana pun.
> - `pengujian` dan `pelatihan` **hanya** boleh mengimpor dari `platform`.
> - `pengujian` dan `pelatihan` **tidak boleh** saling mengimpor. Pertukaran data antar-domain (jika ada) harus dijembatani oleh `platform`.

---

## 1. Domain Platform (`trpc.platform.*`)

Domain ini menangani core entitas yang bersifat umum, autentikasi, notifikasi, serta data-data master yang digunakan oleh seluruh domain lainnya.

| Sub-domain / Fitur | Router / Query File | Prefix Permission Utama | Keterangan |
|---|---|---|---|
| Autentikasi | `auth` | - | Login, register, forgot password, ganti sandi |
| User & Profil | `user`, `employee` | `users.*`, `employees.*` | Data pelanggan dan staf internal |
| Role & Permission | `role`, `permission` | `roles.*`, `permissions.*` | Manajemen RBAC (Role-Based Access Control) |
| Sertifikasi Pegawai | `employee-certification` | `employee-certifications.*` | Data sertifikasi staf |
| Jabatan | `position` | `positions.*` | Jabatan internal |
| Wilayah (Geo) | `province`, `regency`, `district`, `village` | `provinces.*`, dll | Data wilayah administrasi |
| Pengumuman / Media | `banner`, `news`, `event`, `faq`, `media-publications`, `ppid` | `banners.*`, dll | Konten publik dan portal informasi |
| Notifikasi & Audit | `notifications`, `audit` | `notifications.*`, `audits.*` | In-app notifications dan log riwayat mutasi |
| Excel Kepegawaian | `kepegawaian-excel` | `employees.*` | Import/Export data kepegawaian |
| Pengaturan Web | `setting` | `settings.*` | Konfigurasi umum aplikasi |

---

## 2. Domain Pengujian (`trpc.pengujian.*`)

Domain ini berfokus pada laboratorium dan layanan pengujian lingkungan kerja/K3.

| Sub-domain / Fitur | Router / Query File | Prefix Permission Utama | Keterangan |
|---|---|---|---|
| Master Parameter | `cluster`, `parameter-categories`, `parameter` | `parameters.*` | Hierarki parameter (Cluster → Kategori → Parameter) |
| Alat & Bahan | `tool`, `tool-code`, `chemical-material` | `tools.*`, `materials.*` | Manajemen alat ukur, kode inventaris, bahan kimia |
| Relasi Alat/Bahan | `parameter-tool`, `parameter-chemical-material` | `parameters.*` | Mapping parameter butuh alat/bahan apa |
| KBLI & Perusahaan | `kbli`, `user-company`, `user-company-testing-location` | `companies.*` | Data KBLI dan entitas perusahaan pelanggan |
| Order / Keranjang | `cart`, `order`, `order.notification-config` | `orders.*` | Alur pendaftaran order dari cart sampai pembayaran |
| Kaji Ulang (Worksheet)| `worksheet` | `worksheets.*`, `worksheet-items.*` | Perencanaan teknis sebelum pengujian dimulai |
| Pengujian (Testing) | `testing` | `testings.*`, `testing-items.*` | Eksekusi pengujian di lapangan/lab |
| Dokumen & Surat | `document`, `generate-document` | `documents.*` | SPK, Surat Penawaran, LHU (Laporan Hasil Uji) |
| Survei Pelanggan | `survey` | `surveys.*` | Survei kepuasan pelanggan |
| Excel Pengujian | `pengujian-excel` | Beragam | Import/Export data master pengujian |

---

## 3. Domain Pelatihan (`trpc.pelatihan.*`)

Domain ini menangani manajemen e-learning, sertifikasi, bimtek, dan pelatihan tatap muka (LMS).

| Sub-domain / Fitur | Router / Query File | Prefix Permission Utama | Keterangan |
|---|---|---|---|
| Manajemen Pelatihan| `pelatihan` | `pelatihan.*` | Katalog kursus/webinar/bimtek dan silabus |
| Pendaftaran | `cart`, `order`, `enrollment` | `pelatihan-orders.*`, `enrollments.*` | Pembelian, pendaftaran, dan manajemen persetujuan siswa |
| Materi Belajar | `materials` | `materials.*` | Modul, video, atau dokumen bahan ajar |
| Evaluasi / Ujian | `assessment` | `assessments.*` | Soal ujian, kuis, dan nilai peserta |
| Sertifikat | `certificate` | `certificates.*` | Penerbitan sertifikat kelulusan pelatihan |
| Profil Siswa | `profile` | - | Riwayat belajar dan progres kursus |

---

## Cara Pemanggilan tRPC (Contoh Frontend)

Semua endpoint dipanggil menggunakan React Query via tRPC dengan format namespace domain.

```tsx
import { trpc } from "@/utils/trpc";

function KomponenContoh() {
  // 1. Memanggil Domain Platform (contoh: Ambil profil user)
  const user = trpc.platform.user.getById.useQuery({ id: "..." });

  // 2. Memanggil Domain Pengujian (contoh: Mengubah order)
  const mutasiOrder = trpc.pengujian.order.update.useMutation();

  // 3. Memanggil Domain Pelatihan (contoh: Daftar kursus)
  const mutasiEnroll = trpc.pelatihan.enrollment.create.useMutation();
}
```
