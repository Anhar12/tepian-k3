# Pelatihan (Training) Feature - Implementation Guide

Dokumen ini adalah referensi utama (Single Source of Truth) untuk mengimplementasikan dan mengembangkan fitur Pelatihan secara _end-to-end_. Dokumen ini mensintesis desain UI dari Figma (User & Backoffice) dengan arsitektur Better-T-Stack monorepo yang sudah berjalan di sistem.

---

## 1. Arsitektur Tingkat Tinggi & Pemetaan Figma

### A. Sisi Pengguna (End-User)

| Halaman Figma & Aplikasi     | Tabel Utama                                              | tRPC Router & Endpoint                                                              | Keterangan / Pola UI                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing Page / Katalog**   | `pelatihan`, `pelatihanCategories`                       | `trpc.pelatihan.base.getAll`, `trpc.pelatihan.categories.getAll`                    | Menampilkan _card_ kursus. Filter kategori dan _pagination_ di tingkat server.                                                                                            |
| **Detail Pelatihan**         | `pelatihan`, `pelatihanMaterials`                        | `trpc.pelatihan.base.getBySlug`                                                     | Menampilkan deskripsi, silabus, dan tombol `Enroll Now` (gratis) atau `Add to Cart` (berbayar).                                                                           |
| **Keranjang & Checkout**     | `pelatihanCart`                                          | `trpc.pelatihan.cart.*`, `trpc.pengujian.order.create`                              | Keranjang belanja pelatihan. Proses checkout membuat entitas order dengan tipe `pelatihan`.                                                                               |
| **Dashboard (My Trainings)** | `pelatihanEnrollments`                                   | `trpc.pelatihan.enrollment.getMyEnrollments`                                        | Menampilkan daftar pendaftaran kelas beserta persentase kemajuan belajar (%) pengguna.                                                                                    |
| **Daftar Transaksi**         | `order`, `orderItem`                                     | `trpc.pelatihan.order.getMyOrders`                                                  | Riwayat pendaftaran berbayar pengguna dan status pembayaran di [transaksi.tsx](<file:///d:/project/k3/tepian-k3/apps/web/src/routes/(core)/pelatihan/transaksi.tsx>).     |
| **Buku Ruang Kelas (LMS)**   | `pelatihanMaterials`, `pelatihanProgress`                | `trpc.pelatihan.progress.markMaterialComplete`                                      | Wadah belajar di [belajar.$enrollmentId.tsx](<file:///d:/project/k3/tepian-k3/apps/web/src/routes/(core)/pelatihan/belajar/$enrollmentId.tsx>) (sidebar materi & player). |
| **Ujian (Pre/Post Test)**    | `pelatihanAssessments`, `pelatihanQuestions`, `attempts` | `trpc.pelatihan.assessment.startAttempt`, `trpc.pelatihan.assessment.submitAttempt` | Menjawab soal pilihan ganda atau esai. Halaman ujian di `/pelatihan/belajar/$enrollmentId/ujian/$id`.                                                                     |
| **Sertifikat Kelulusan**     | `pelatihanCertificates`                                  | `trpc.pelatihan.certificate.getById`                                                | Menampilkan sertifikat digital ber-QR code untuk kelas yang telah diselesaikan (_completed_).                                                                             |

### B. Sisi Backoffice / Instruktur

| Halaman Aplikasi Backoffice | Tabel Utama                                  | tRPC Router & Endpoint                                                 | Keterangan / Pola UI                                                                           |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Manajemen Kursus**        | `pelatihan`                                  | `trpc.pelatihan.base.*`                                                | Pengelolaan kursus CRUD (Draft, Published, Archived) di panel back-office admin.               |
| **Manajemen Kurikulum**     | `pelatihanMaterials`, `pelatihanAssessments` | `trpc.pelatihan.materials.*`, `trpc.pelatihan.assessment.*`            | Menyusun materi video/PDF dan instrumen ujian per bab (mengacu `orderIndex`).                  |
| **Pemeriksaan Tugas/Esai**  | `pelatihanAssessmentAttempts`, `answers`     | `trpc.pelatihan.assessment.getAttemptsForGrading`, `gradeEssayAnswers` | Panel khusus instruktur untuk memeriksa dan memberi nilai pada jawaban esai peserta pelatihan. |

---

## 2. Struktur Schema & Keamanan Database

### A. Tabel Jadwal & Token Presensi (`pelatihanSchedules`)

Tabel `pelatihanSchedules` di [pelatihan.ts](file:///d:/project/k3/tepian-k3/packages/db/src/schema/pelatihan.ts) mencatat sesi kelas langsung (sinkronus). Untuk verifikasi kehadiran, kolom `attendanceToken` menyimpan token 10 karakter unik yang di-generate instruktur:

```typescript
attendanceToken: varchar("attendance_token", { length: 10 });
```

Pengguna wajib menginput token yang sama pada method `submitAttendance` untuk mengubah status kehadiran menjadi `present`.

### B. Zod Validation (Essay Grading)

Skema penyerahan nilai esai divalidasi menggunakan `gradeEssayAnswersSchema` di [pelatihan.schema.ts](file:///d:/project/k3/tepian-k3/packages/schema/src/pelatihan/pelatihan.schema.ts):

```typescript
export const gradeEssayAnswersSchema = z.object({
  attemptId: z.string().uuid(),
  grades: z.array(
    z.object({
      questionId: z.string().uuid(),
      pointsEarned: z.number().min(0),
      isCorrect: z.boolean(),
      feedback: z.string().optional(),
    }),
  ),
});
```

---

## 3. Logika Bisnis Kritis (Crucial Business Workflows)

### 1. Kunci Kurikulum Berurutan (Sequential Material Lock)

Untuk memastikan pengguna belajar secara terstruktur, sistem menerapkan validasi sekuensial di layer query [enrollment.queries.ts](file:///d:/project/k3/tepian-k3/packages/queries/src/pelatihan/enrollment.queries.ts#L486):

- Ketika pengguna mencoba membuka/menyelesaikan materi pada indeks $N$ ($N > 0$), sistem akan mengambil seluruh materi pelatihan yang diurutkan berdasarkan `orderIndex` terkecil.
- Sistem mencari materi ke-$N-1$. Progress materi ke-$N-1$ tersebut wajib bernilai `completed: true`.
- Jika belum selesai, tRPC akan melempar `403 FORBIDDEN` dengan pesan `"Materi sebelumnya belum diselesaikan"`.

### 2. Alur Penilaian Ujian Esai (Manual Essay Grading)

Berbeda dengan pilihan ganda yang dinilai otomatis oleh server, ujian esai membutuhkan penilaian manual oleh instruktur:

1.  Peserta mengirim jawaban → status attempt diatur menjadi `submitted`.
2.  Instruktur memanggil `getAttemptsForGrading` untuk melihat daftar ujian yang perlu dinilai.
3.  Instruktur memberikan nilai per pertanyaan melalui `gradeEssayAnswers`.
4.  Di dalam **satu transaksi database tunggal** (`db.transaction`):
    - Setiap baris di `pelatihanAssessmentAnswers` diubah (disimpan nilai poin, status benar/salah, komentar instruktur, dan ID penilai).
    - Skor total pengerjaan dihitung ulang berdasarkan perbandingan `pointsEarned` dengan nilai bobot maksimal di `pelatihanQuestions`.
    - Status attempt diubah menjadi `graded`.
    - Jika ujian tersebut bertipe `post_test` dan hasil nilai melampaui `passingScore`, status `pelatihanEnrollments` pengguna secara otomatis diubah menjadi `completed` (Lulus) dan mencatat waktu kelulusan `completedAt`.
5.  Notifikasi kelulusan/penilaian dikirimkan secara instan ke notifikasi akun pengguna.

### 3. Otomasi Pembayaran & Aktivasi Kelas (Auto-Enrollment Webhook)

Ketika modul pembayaran mengonfirmasi pembayaran pesanan (`confirmPayment`), sistem melakukan iterasi pada item pesanan. Jika bertipe `"pelatihan"`, maka secara otomatis mendaftarkan pengguna ke kelas bersangkutan, menghapus item dari keranjang pelatihan, dan mengirimkan notifikasi selamat bergabung.

---

## 4. Panduan bagi Developer & AI Model

### Tips Maintainability & Best Practices

1.  **Gunakan Effect gen murni:** Semua manipulasi data database di layer queries harus mengembalikan objek `Effect` untuk kontrol kesalahan terpadu.
2.  **Order Index:** Selalu gunakan pengurutan `.orderBy(asc(materials.orderIndex))` saat memproses kurikulum agar urutan kunci sequential lock konsisten antara client dan server.
3.  **Audit Logs:** Pastikan setiap fungsi mutasi baru di tRPC router memanggil `auditQueries.createAudit` untuk menjamin kepatuhan audit log platform.
4.  **Casing PK:** Gunakan UUIDv7 untuk primary key baru pada tabel pelatihan di masa mendatang.
