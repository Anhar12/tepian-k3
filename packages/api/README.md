# @tepian-k3/api

Paket ini berisi semua router API tRPC untuk backend. Ini adalah antarmuka publik untuk berinteraksi dengan layanan database dan query.

## Struktur Direktori

- `routers/`: Tempat berkumpulnya router yang dikelompokkan berdasarkan domain.
  - `routers/platform/`: Router untuk fungsi platform (Auth, User, Company, dll).
  - `routers/pengujian/`: Router untuk domain pengujian (Worksheet, Testing, Alat, dll).
  - `routers/pelatihan/`: Router untuk domain pelatihan (Opsional/Masa Depan).
- `index.ts`: Entry point (AppRouter) yang menggabungkan semua router menjadi satu.

## Penggunaan

Router ini tidak berisi logika bisnis mentah atau query SQL langsung, melainkan berfungsi sebagai jembatan antara permintaan klien dan modul `@tepian-k3/queries` atau `@tepian-k3/services`.

```typescript
// Contoh di dalam router:
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      // Selalu gunakan runEffect saat memanggil fungsi queries!
      return runEffect(userQueries.getById(input));
    }),
});
```

Selalu pastikan Anda menggunakan namespace prosedur yang benar (`publicProcedure`, `protectedProcedure`, `adminProcedure`) untuk menjaga keamanan endpoint.
