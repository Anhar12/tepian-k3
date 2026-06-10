# Pelatihan (Training) Feature - Implementation Guide

Dokumen ini adalah referensi utama (Single Source of Truth) untuk mengimplementasikan fitur Pelatihan secara _end-to-end_. Dokumen ini mensintesis desain UI dari Figma (User & Backoffice) dengan arsitektur Better-T-Stack monorepo.

---

## 1. Arsitektur Tingkat Tinggi & Pemetaan Figma

### A. Sisi Pengguna (End-User)

| Halaman Figma                | Tabel Utama                                  | tRPC Router                                      | Keterangan / Pola UI                                                                              |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Landing Page / Katalog**   | `pelatihan`, `pelatihanCategories`           | `pelatihan.getAll`, `pelatihanCategories.getAll` | Menampilkan _card_ kursus. Filter dan _pagination_ diterapkan di sisi klien/server.               |
| **Detail Pelatihan**         | `pelatihan`, `pelatihanMaterials`            | `pelatihan.getBySlug`                            | Tombol `Enroll Now` (jika gratis) atau `Add to Cart` (jika berbayar).                             |
| **Cart & Checkout**          | `pelatihanCart`                              | `pelatihanCart.*`, `order.create`                | Cart Pelatihan **terpisah** dari Cart Pengujian. Checkout membuat entitas di tabel `order`.       |
| **Dashboard (My Trainings)** | `pelatihanEnrollments`, `pelatihanProgress`  | `pelatihanEnrollments.getMyEnrollments`          | Menampilkan progres (%) kursus.                                                                   |
| **E-Learning & Materi**      | `pelatihanMaterials`                         | `pelatihanProgress.markMaterialComplete`         | Layout _sidebar_ (daftar materi) & _main content_ (video/PDF). Accordion digunakan untuk silabus. |
| **Pre/Post Test**            | `pelatihanAssessments`, `pelatihanQuestions` | `pelatihanAssessmentAttempts.*`                  | Soal pilihan ganda/esai. Timer berjalan di _client_, validasi akhir di _server_.                  |

### B. Sisi Backoffice Admin

| Halaman Figma                | Tabel Utama                                  | tRPC Router                                      | Keterangan / Pola UI                                                   |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| **Manajemen Kursus**         | `pelatihan`                                  | `pelatihan.*`                                    | Tabel data (CRUD). Penggunaan status `draft`, `published`, `archived`. |
| **Manajemen Materi & Ujian** | `pelatihanMaterials`, `pelatihanAssessments` | `pelatihanMaterials.*`, `pelatihanAssessments.*` | UI _drag-and-drop_ / pengurutan modul (_orderIndex_).                  |
| **Monitoring Peserta**       | `pelatihanEnrollments`                       | `pelatihanEnrollments.getPaginated`              | Pantau progres, nilai pre/post test, dan status kelulusan peserta.     |

---

## 2. Cuplikan Kode Spesifik (Drizzle & Zod)

### A. Schema Drizzle Core (packages/db/src/schema.ts)

Penambahan Enum:

```typescript
export const pelatihanLevelEnum = pgEnum("pelatihan_level", [
  "beginner",
  "intermediate",
  "advanced",
]);
export const pelatihanStatusEnum = pgEnum("pelatihan_status", [
  "draft",
  "published",
  "archived",
]);
export const materialTypeEnum = pgEnum("material_type", [
  "ppt",
  "pdf",
  "video",
  "document",
  "link",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "in_progress",
  "completed",
  "failed",
  "expired",
]);
```

_Pastikan menambahkan `pelatihan` ke dalam `orderItemTypeEnum` yang sudah ada._

Contoh Tabel `pelatihan`:

```typescript
export const pelatihan = createTable(
  "pelatihan",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .$default(() => uuidv7()),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),
    categoryId: uuid("category_id").references(() => pelatihanCategories.id),
    level: pelatihanLevelEnum("level").notNull(),
    duration: integer("duration").notNull(), // dalam jam
    capacity: integer("capacity"),
    price: integer("price").notNull().default(0), // 0 = Gratis
    discountPrice: integer("discount_price"),
    prerequisiteIds: uuid("prerequisite_ids").array(),
    minimumScore: integer("minimum_score").notNull().default(70),
    status: pelatihanStatusEnum("status").notNull().default("draft"),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    instructorName: varchar("instructor_name", { length: 250 }),
    ...timestamps,
  },
  (table) => ({
    slugIdx: uniqueIndex("pelatihan_slug_idx")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

### B. Validasi Zod (packages/schema/src/pelatihan.schema.ts)

Contoh Skema Cart & Enrollment:

```typescript
import { z } from "zod";

export const addToCartSchema = z.object({
  pelatihanId: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

export const directEnrollmentSchema = z.object({
  pelatihanId: z.string().uuid(),
  // Berlaku validasi backend tambahan: pastikan pelatihan.price === 0
});

export const updateProgressSchema = z.object({
  enrollmentId: z.string().uuid(),
  materialId: z.string().uuid(),
  watchedDuration: z.number().optional(), // dalam detik
});
```

---

## 3. Logika Bisnis Kritis (Alur Kerja)

1. **Konstrain Unik Cart & Enrollment:**
   - Seorang pengguna tidak boleh memiliki kursus yang sama di dalam keranjang lebih dari satu (Unik: `userId`, `pelatihanId` di `pelatihanCart`).
   - Seorang pengguna tidak boleh mendaftar kursus yang sama dua kali (Unik: `userId`, `pelatihanId` di `pelatihanEnrollments`).

2. **Auto-Enrollment Webhook:**
   Ketika Admin/Sistem memverifikasi pembayaran (`confirmPayment` di router `order`), sistem **harus** melakukan _looping_ pada `orderItems`. Jika `type === "pelatihan"`, secara otomatis buat data di `pelatihanEnrollments` dengan status `enrolled`, lalu hapus item dari `pelatihanCart`.

3. **Sertifikat & QR:**
   Jika pengguna mendapatkan `postTestScore >= minimumScore`, sistem memanggil `generatePelatihanCertificate` dari `services`. Servis ini membuat token, _embed_ QR Code via PDF Service, menyimpannya di Storage, dan mencatatnya ke tabel `pelatihanCertificates`.

---

## 4. Urutan Pengerjaan (Execution Checklist)

- [ ] **1. Modifikasi Database (`packages/db`)**
  - Buat enum dan 12 tabel baru di `schema.ts`.
  - Jalankan `pnpm db:generate` dan `pnpm db:migrate`.
- [ ] **2. Constants & Access Control (`packages/constants`)**
  - Tambahkan list permission baru (e.g., `pelatihan.read`, `pelatihan.manage`) di `permissions.ts`.
- [ ] **3. Input Validation (`packages/schema`)**
  - Buat file `.schema.ts` untuk validasi formulir dan _payload_ API.
- [ ] **4. Business Logic Queries (`packages/queries`)**
  - Gunakan `Effect.gen` murni untuk operasi CRUD dan logika transaksional kompleks.
- [ ] **5. Backend API (`packages/api`)**
  - Buat 10 router tRPC baru dan sematkan validasi permission (`withPermission`).
  - _Inject_ logika auto-enrollment di router order yang sudah ada.
- [ ] **6. UI Backoffice Admin (`apps/web`)**
  - Implementasi tabel data dan formulir manajemen pelatihan, menggunakan komponen standar Shadcn.
- [ ] **7. UI End-User (`apps/web`)**
  - Implementasi Landing Page, Cart, interaksi Checkout.
  - Implementasi Learning Management System (LMS) mikro: Sidebar materi, video player, dan halaman Assessment.

---

> _Dokumen ini merupakan panduan iterasi. Jika ada perubahan struktur di masa mendatang, dokumen ini harus diperbarui agar selaras dengan basis kode monorepo._
