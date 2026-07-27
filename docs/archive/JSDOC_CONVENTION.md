# JSDoc Convention

**Semua exported functions, hooks, dan React components baru WAJIB menyertakan dokumentasi JSDoc.**

Dokumentasi ini penting agar:

- Developer lain (dan AI agents) dapat memahami tujuan setiap fungsi tanpa membaca implementasinya
- IDE dapat menampilkan tooltip yang informatif
- Kode generated oleh AI dapat di-review dengan mudah

---

## Functions & Query Functions

```typescript
/**
 * Mengambil daftar pelatihan yang dipaginasi berdasarkan filter pencarian.
 *
 * @param input - Opsi filter dan paginasi
 * @param input.page - Nomor halaman saat ini (dimulai dari 1)
 * @param input.limit - Jumlah item per halaman (default: 10)
 * @param input.search - Kata kunci pencarian berdasarkan judul (opsional)
 * @param input.status - Filter berdasarkan status pelatihan (opsional)
 * @returns Daftar pelatihan beserta metadata paginasi
 */
export const getPaginatedPelatihan = (input: GetPaginatedPelatihanInput) =>
  Effect.tryPromise({ ... });
```

---

## React Components

```typescript
/**
 * Menampilkan kartu ringkasan pelatihan dengan thumbnail, judul, dan tombol aksi.
 *
 * @param props - Props komponen
 * @param props.pelatihan - Data pelatihan yang akan ditampilkan
 * @param props.onEdit - Callback yang dipanggil saat tombol edit diklik
 * @param props.onDelete - Callback yang dipanggil saat tombol hapus diklik
 * @param props.isLoading - Menandakan apakah ada operasi async yang berjalan
 */
export function PelatihanCard({
  pelatihan,
  onEdit,
  onDelete,
  isLoading,
}: PelatihanCardProps) { ... }
```

---

## Custom Hooks

```typescript
/**
 * Hook untuk mengelola state keranjang pelatihan dan aksi add/remove/clear.
 *
 * Menggunakan TanStack Query untuk cache management dan optimistic updates.
 *
 * @param userId - UUID user yang memiliki keranjang
 * @returns Item keranjang, total harga, dan handler mutasi
 *
 * @example
 * const { cartItems, totalPrice, addToCart, removeFromCart } = usePelatihanCart(userId);
 */
export function usePelatihanCart(userId: string) { ... }
```

---

## tRPC Router Procedures

```typescript
export const pelatihanRouter = createTRPCRouter({
  /**
   * Mengambil data satu pelatihan berdasarkan ID.
   * Melempar NOT_FOUND jika pelatihan tidak ada atau sudah dihapus.
   * Membutuhkan permission: pelatihan.view
   */
  getPelatihanById: withPermission("pelatihan.view")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => { ... }),

  /**
   * Membuat pelatihan baru dengan status draft.
   * Membutuhkan permission: pelatihan.create
   * Menyimpan audit log otomatis setelah pembuatan berhasil.
   */
  create: withPermission("pelatihan.create")
    .input(createPelatihanSchema)
    .mutation(async ({ ctx, input }) => { ... }),
});
```

---

## Query Functions (Effect-based)

```typescript
/**
 * Membuat record pelatihan baru di database.
 *
 * @param input - Data pelatihan yang akan disimpan
 * @returns Effect yang menghasilkan pelatihan yang baru dibuat,
 *          atau melempar INTERNAL_SERVER_ERROR jika gagal
 */
export const createPelatihan = (input: CreatePelatihanInput) =>
  Effect.tryPromise({ ... });
```

---

## Rules

| Aturan        | Keterangan                                                                        |
| ------------- | --------------------------------------------------------------------------------- |
| ✅ **Selalu** | Tambahkan JSDoc ke exported functions, hooks, dan components baru                 |
| ✅ **Selalu** | Tambahkan JSDoc ke utility dan service functions                                  |
| ✅ **Selalu** | Dokumentasikan semua parameter dengan `@param` dan return value dengan `@returns` |
| ✅ **Selalu** | Tulis deskripsi yang menjelaskan **tujuan** fungsi, bukan sekadar nama-nya        |
| ✅ **Selalu** | Gunakan `@example` untuk hooks dan utility functions yang kompleks                |
| ❌ **Jangan** | Tambahkan JSDoc ke one-liner sederhana atau anonymous arrow functions             |
| ❌ **Jangan** | Tambahkan JSDoc ke unexported internals atau helper kecil                         |
| ❌ **Jangan** | Copy-paste nama parameter sebagai deskripsi (misalnya `@param id - The id`)       |

### Bahasa

- Deskripsi JSDoc ditulis dalam **Bahasa Indonesia** (konsisten dengan error messages)
- Nama parameter dan return types tetap dalam bahasa Inggris (mengikuti TypeScript)

### Contoh Buruk (Hindari)

```typescript
// ❌ Terlalu singkat, tidak informatif
/**
 * Get pelatihan by id.
 * @param id - The id
 */
export const getPelatihanById = (id: string) => ...

// ❌ Hanya mendeskripsikan nama, bukan tujuan
/**
 * Create pelatihan function.
 */
export const createPelatihan = (input: CreatePelatihanInput) => ...
```

### Contoh Baik

```typescript
// ✅ Menjelaskan tujuan + behavior + side effects
/**
 * Mengambil detail lengkap satu pelatihan termasuk materi dan assessment-nya.
 * Melempar NOT_FOUND jika pelatihan tidak ditemukan atau sudah dihapus (soft delete).
 *
 * @param id - UUID pelatihan yang ingin diambil
 * @returns Data pelatihan lengkap termasuk relasi materials dan assessments
 */
export const getPelatihanById = (id: string) =>
  Effect.tryPromise({ ... });
```
