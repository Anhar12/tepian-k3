# Panduan Berkontribusi (Contributing Guide)

Selamat datang di proyek **tepian-k3**! Kami menghargai setiap kontribusi untuk menjadikan sistem ini lebih baik. Panduan ini akan membantu Anda memahami alur kerja (workflow) pengembangan di repositori ini.

## 1. Persiapan Awal

Sebelum mulai menulis kode, pastikan environment lokal Anda sudah siap:
1. Baca dan ikuti [Panduan Memulai Cepat (QUICKSTART)](docs/getting-started/QUICKSTART.md) untuk instalasi dan setup database.
2. Pastikan Anda menggunakan `pnpm` (bukan npm atau yarn).
3. Pahami batasan modul (Module Boundaries) di [ARCHITECTURE.md](docs/getting-started/ARCHITECTURE.md).

## 2. Alur Kerja Git (Git Workflow)

Kami menggunakan alur kerja berbasis branch dan Pull Request (PR).

### Penamaan Branch (Branch Naming)
Gunakan format berikut untuk penamaan branch:
- `feat/<nama-fitur>` : Untuk fitur baru
- `fix/<nama-bug>` : Untuk perbaikan bug
- `docs/<nama-dokumen>` : Untuk pembaruan dokumentasi
- `chore/<nama-tugas>` : Untuk tugas pemeliharaan, refactoring, atau update dependency

Contoh: `feat/order-approval`, `fix/login-error`

### Commit Message
- Tulis commit message dalam **Bahasa Indonesia** atau **Bahasa Inggris** yang deskriptif.
- Jelaskan **apa** yang diubah dan **mengapa**.

## 3. Aturan Kode (Coding Standards)

- **JSDoc**: Wajib menambahkan JSDoc pada setiap exported function, hook, dan komponen UI baru. (Lihat panduan di codebase atau gunakan referensi yang ada).
- **Format Kode**: Gunakan Prettier. Jalankan `pnpm web:prettier` sebelum commit untuk area web.
- **Bahasa Pesan Error**: Semua error message yang ditampilkan ke pengguna harus dalam **Bahasa Indonesia**.

## 4. Pengujian (Testing)

Setiap fitur atau perbaikan baru sebaiknya menyertakan pengujian (test).
- Baca [Panduan Pengujian (TESTING GUIDE)](docs/testing/TESTING_GUIDE.md) untuk detail cara menulis test menggunakan Vitest dan PGlite.
- Gunakan *fixtures* yang tersedia di `docs/testing/FIXTURES_REFERENCE.md` untuk membuat data uji.
- Pastikan semua test lulus dengan menjalankan:
  ```bash
  pnpm test
  ```

## 5. Checklist Sebelum Pull Request (PR)

Sebelum Anda membuat PR, pastikan checklist berikut terpenuhi:

- [ ] Kode sudah diformat dengan Prettier.
- [ ] Lulus type checking secara menyeluruh:
  ```bash
  pnpm check-types
  ```
- [ ] Semua test (lama dan baru) lulus (`pnpm test`).
- [ ] Tidak ada file `.env` atau *secret keys* yang ikut ter-commit.
- [ ] Menambahkan JSDoc pada fungsi/komponen utama yang baru.
- [ ] Jika ada mutasi data baru, pastikan sudah menggunakan fungsi Audit Log.

## 6. Proses Code Review

- PR Anda akan direview oleh tim pengembang atau AI Agent.
- Perhatikan komentar review dan lakukan perbaikan jika diperlukan.
- Setelah PR disetujui (Approved) dan semua *CI checks* hijau, PR akan di-merge ke branch utama.
