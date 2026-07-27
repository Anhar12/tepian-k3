# Panduan Routing Frontend (TanStack Router)

Aplikasi web tepian-k3 menggunakan **TanStack Router** untuk _file-based routing_ yang sepenuhnya type-safe. Seluruh rute berada di dalam direktori `apps/web/src/routes/`.

---

## 1. Struktur Direktori Rute

Struktur folder mencerminkan URL aplikasi:

```
apps/web/src/routes/
├── __root.tsx           # Layout utama aplikasi
├── (core)/              # Grup rute yang membutuhkan autentikasi
│   ├── _layout.tsx      # Layout core (sidebar, header)
│   ├── back-office/     # Rute admin / internal
│   ├── employee/        # Rute khusus employee (laboran, dll)
│   ├── display-board/   # Dashboard read-only
│   └── user/            # Halaman untuk pelanggan (customer)
├── (public)/            # Grup rute publik
│   └── pelatihan/       # Landing page pelatihan
└── login.tsx            # Halaman login
```

- **Folder dalam kurung** seperti `(core)` adalah **Route Groups**. Ini tidak mengubah URL (contoh: rute di `(core)/back-office/` dapat diakses di `/back-office/`) tetapi mengelompokkan layout dan *loaders* yang sama.
- File berawalan `_` seperti `_layout.tsx` adalah layout khusus untuk rute di folder tersebut dan subfoldernya.

---

## 2. Pengamanan Rute (Route Guards)

Rute diamankan sebelum di-render (pada fase `beforeLoad`).

### A. Autentikasi Dasar
Semua rute di bawah `(core)` dilindungi oleh autentikasi di tingkat layout grup. Jika user belum login, akan diarahkan ke `/login`.

### B. Otorisasi Rute (Permission Guard)
Gunakan utilitas proteksi di blok `beforeLoad` untuk halaman spesifik.

```tsx
// apps/web/src/routes/(core)/back-office/orders/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/(core)/back-office/orders/$id")({
  // Validasi parameter rute
  params: z.object({ id: z.string() }),
  
  // Guard
  beforeLoad: async ({ context }) => {
    // Mengecek apakah user memiliki role 'admin' atau permission tertentu
    await requirePermission(context, { permission: "orders.read" });
  },
  
  // Pre-fetching data sebelum komponen di-render
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      context.trpc.pengujian.order.getById.queryOptions({ id: params.id })
    );
  },
  
  component: OrderDetailComponent,
});
```

---

## 3. Navigasi

Gunakan komponen `<Link>` dari `@tanstack/react-router` untuk bernavigasi, bukan tag `<a>`. Ini menjamin rute divalidasi oleh TypeScript.

```tsx
import { Link } from "@tanstack/react-router";

// Type-safe URL, akan eror jika URL tidak terdaftar di rute
<Link to="/back-office/orders/$id" params={{ id: "123" }}>
  Detail Order
</Link>
```

---

## 4. State URL & Search Parameters

TanStack Router menjadikan URL sebagai state manager yang superior. Validasi URL parameter (query string) menggunakan Zod di definisi rute.

```tsx
const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
  search: z.string().optional(),
});

export const Route = createFileRoute("/(core)/back-office/orders/")({
  validateSearch: searchSchema,
  // ...
});

// Mengambil nilai search di komponen
const { page, search } = Route.useSearch();
```

Hindari menggunakan `useState` untuk nilai pencarian dan pagination; selalu dorong ke URL parameter agar tautan bisa dibagikan (shareable).
