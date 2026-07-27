# Autentikasi & Otorisasi

Sistem tepian-k3 menggunakan pendekatan **Role-Based Access Control (RBAC)** dengan caching granular permission di dalam JWT token. Sistem ini juga menyatukan autentikasi pelanggan (user) dan karyawan (employee) ke dalam satu alur login.

---

## 1. Arsitektur Autentikasi (JWT)

Aplikasi menggunakan **JSON Web Tokens (JWT)** stateles dengan algoritma `HS256` untuk manajemen sesi. Semua logika verifikasi ditangani oleh paket `@tepian-k3/auth` menggunakan library `jose` (sehingga kompatibel dengan edge runtime).

### Caching Permission di JWT
Saat user atau karyawan login, sistem akan:
1. Mengambil semua *roles* yang dimiliki user.
2. Mengekstrak *permissions* dari setiap role.
3. Memasukkan array permission tersebut langsung ke dalam payload JWT.

> **⚠️ Penting**: Karena permission di-cache di dalam token, perubahan hak akses di database **tidak akan berlaku** secara langsung pada sesi yang sedang aktif. User harus logout dan login kembali untuk mendapatkan token baru dengan permission yang diperbarui.

---

## 2. Alur Login Terpadu (User & Employee)

Baik pelanggan maupun karyawan internal login melalui endpoint yang sama: `/api/auth/login`.

- **Pelanggan**: Hanya tercatat di tabel `users`. Memiliki role default `"user"`.
- **Karyawan**: Memiliki record di tabel `users` untuk autentikasi, serta berelasi dengan tabel `employees` (`userId` sebagai foreign key).

### Perlindungan Rute Dinamis di Frontend
Untuk rute `/back-office`, `/employee`, dan `/display-board`, sistem memblokir pelanggan dengan memeriksa *dynamic role*. 
Siapa pun yang memiliki setidaknya satu role **selain** `"user"` dianggap sebagai staf internal dan diizinkan melewati middleware dasar. Hak akses mendetail pada setiap halaman akan dicek lebih lanjut oleh komponen `PermissionGate`.

---

## 3. Sistem Hak Akses (Permissions)

Format permission menggunakan pola `resource.action` (contoh: `orders-approval.approve`).

- **Resources**: Daftar entitas (seperti `orders`, `worksheets`, `documents`) yang didefinisikan di `packages/constants/src/resources.ts`.
- **Actions**: Tindakan yang bisa dilakukan (seperti `view`, `create`, `update`, `verify`, `approve`) yang didefinisikan di `packages/constants/src/permissions.ts`.

### Tabel Tindakan (Action) Utama

| Action    | Fungsi |
| --------- | ------ |
| `view`    | Melihat daftar/index resource (tabel paginasi, sidebar). |
| `read`    | Melihat detail satu record (halaman detail). |
| `create`  | Menambahkan record baru. |
| `update`  | Memperbarui record yang ada. |
| `delete`  | Menghapus (soft delete). |
| `review`  | Meminta revisi atau mengembalikan state ke proses sebelumnya. |
| `verify`  | Memverifikasi di tengah-tengah alur kerja multi-step. |
| `approve` | Memberikan persetujuan akhir (final decision). |
| `reject`  | Menolak sepenuhnya alur kerja. |

> **Catatan**: Menambahkan action baru ke `PERMISSION_ACTION` memerlukan migrasi database (`pnpm db:generate && pnpm db:migrate`) karena PostgreSQL menggunakan tipe enum yang bersumber dari konstanta tersebut.

---

## 4. Titik Penegakan (Enforcement Points)

Hak akses ditegakkan di dua lapisan berbeda:

### A. Lapisan API (Backend) - Mutlak
Di tRPC router, setiap rute diamankan menggunakan middleware `withPermission()`. Ini memblokir eksekusi di server dan mengembalikan status `FORBIDDEN` jika JWT tidak memiliki permission yang diminta.

```typescript
// Contoh di packages/api/src/routers/pengujian/order.ts
export const orderRouter = createTRPCRouter({
  approveOrder: withPermission("orders-approval.approve")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => { ... })
});
```

### B. Lapisan UI (Frontend) - Kosmetik / Visual
Di aplikasi web, tombol dan komponen dirender secara kondisional menggunakan komponen `<PermissionGate>`. Komponen ini mengecek `profile.permissions` (berasal dari JWT).

```tsx
<PermissionGate permission="worksheets.approve">
  <Button onClick={handleApprove}>Setujui Worksheet</Button>
</PermissionGate>
```

> **Aturan Wajib**: Selalu pasangkan `PermissionGate` di UI dengan middleware `withPermission` di sisi API.

---

## 5. Ringkasan Role Penting

Berikut adalah beberapa peran krusial dalam sistem pengujian:

- **super_admin**: Memiliki akses penuh.
- **kepala_balai**: Pemegang otoritas tertinggi (final). Satu-satunya role yang memegang `orders-approval.approve`.
- **admin**: Back-office administrator. Mengecek kelengkapan awal, meminta revisi (`orders-approval.review`), namun tidak dapat memberi persetujuan akhir.
- **koordinator_pengujian / penyelia / koordinator_mutu**: Bisa menolak order, serta memverifikasi dan menyetujui lembar kerja (worksheet).
- **koordinator_administrasi**: Mengelola biaya operasional, dokumen penawaran, dan SPK.
- **kaji_ulang**: Spesifik bertugas mengisi instrumen, bahan kimia, estimasi biaya di lembar kerja awal dan melakukan "submit for verification" (`worksheets.update`).
- **petugas_laboratorium**: Memasukkan hasil analisa dari laboratorium (`worksheet-items.update`).
- **bendahara**: Memverifikasi bukti bayar dan menyetujui kode billing (`orders-payment.verify`, `orders-payment.approve`).
- **user**: Pelanggan/Customer. Hanya bisa membuat order, upload bukti bayar, dan mengisi survei.

---

## 6. Jebakan Umum (Common Pitfalls)

1. **`worksheets.update` bukanlah permission untuk sekadar mengedit.** Ini secara eksklusif merupakan gerbang untuk tombol "Ajukan Verifikasi" (Submit for verification) milik role `kaji_ulang`. Gunakan `worksheet-items.update` atau `worksheet-tools.update` untuk aksi mengedit form biasa.
2. **`orders-approval.approve` sangat eksklusif**. Hanya `kepala_balai` yang boleh memilikinya. Jangan sembarangan memberikan ini ke admin atau koordinator.
3. **Semua UI tombol action** seperti persetujuan, penolakan, verifikasi dokumen, dll, menggunakan aksi spesifik (seperti `.verify`, `.approve`, `.reject`), dan tidak sekadar menggunakan `.update`.
4. Untuk super admin, hindari mendaftarkan permissions satu per satu di database. Gunakan fungsi helper `getAllPermissions()` saat seeder/assigning.
