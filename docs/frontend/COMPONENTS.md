# Panduan Komponen Frontend

Sistem UI tepian-k3 menggunakan pendekatan berbasis komponen dengan menggunakan **shadcn/ui** dan **TailwindCSS**.

## 1. Direktori Komponen

Semua komponen ditempatkan di dalam `apps/web/src/components/`:

- `components/ui/` : Komponen generik dari shadcn/ui (mis. `button.tsx`, `dialog.tsx`, `input.tsx`).
- `components/` : Komponen spesifik domain yang dibuat secara custom (mis. `navbar.tsx`, `image-with-fallback.tsx`).

## 2. Aturan Penggunaan shadcn/ui

- **Jangan buat komponen UI dasar dari awal** jika shadcn/ui telah menyediakannya. Selalu periksa folder `components/ui/` terlebih dahulu.
- **Jangan mengubah gaya default komponen ui** secara hardcode di dalam file aslinya kecuali ingin mengubah gaya global aplikasi. 
- Untuk memodifikasi tampilan pada halaman tertentu, teruskan properti `className` tambahan saat menggunakan komponen (contoh: `<Button className="bg-red-500">Batal</Button>`).

## 3. Komponen Khusus (Custom Components)

Ada beberapa komponen custom yang sering digunakan di tepian-k3:

| Komponen | Path | Kegunaan |
|----------|------|----------|
| `ImageWithFallback` | `@/components/image-with-fallback` | Digunakan alih-alih `<img>` bawaan HTML, menampilkan gambar fallback apabila URL gagal dimuat. |
| `SingleImageUpload` | `@/components/ui/single-image-upload` | Komponen dropzone untuk mengunggah gambar dengan pratinjau. |
| `Spinner` | `@/components/ui/spinner` | Loading indikator kecil. |
| `PermissionGate` | (berada di routes/layout atau utils auth UI) | Komponen untuk membungkus elemen (seperti tombol) agar hanya tampil untuk pengguna dengan hak akses tertentu. |
| `Field` & `FieldLabel` | `@/components/ui/field` | Pembungkus standar untuk form input (memastikan jarak dan tipografi konsisten). |

## 4. Format Formulir (Form Patterns)

Selalu gunakan format seragam untuk formulir input:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="title">Judul Pelatihan</FieldLabel>
    <Input id="title" placeholder="Masukkan judul..." {...register("title")} />
    {errors.title && <FieldError>{errors.title.message}</FieldError>}
  </Field>
</FieldGroup>
```

- Selalu sertakan `FieldLabel`.
- Tampilkan indikator wajib (*) jika field harus diisi.
- Tombol Submit selalu berada di pojok kanan bawah dengan keadaan `disabled` saat sedang loading.
- Tombol Batal selalu diletakkan di sebelah kiri tombol Submit.

## 5. Daftar Hooks Penting (Hooks)

Terdapat beberapa hooks krusial yang sering digunakan di aplikasi:

| Hook | Sumber / Path | Deskripsi |
|------|--------------|-----------|
| `useAuth` | `@/hooks/use-auth` | Mengambil data sesi pengguna, role, dan fungsi autentikasi (login, logout). |
| `usePermissions` | `@/hooks/use-permissions` | Memeriksa apakah pengguna memiliki permission spesifik. |
| `trpc` (Hooks) | `@tepian-k3/api` (via trpc client) | Contoh: `trpc.platform.user.getById.useQuery()`. Seluruh pengambilan data dilakukan via tRPC hooks. |
| `useToast` | `@/components/ui/use-toast` | Memunculkan notifikasi flash (toast) untuk interaksi sukses/error. |
| `useRouter` | `@tanstack/react-router` | Mengatur navigasi dan routing secara terprogram. |

## 6. Ikon

- Gunakan **Lucide React** (`lucide-react`) untuk mayoritas ikon.
- Jika ada ikon yang tidak tersedia di Lucide, gunakan **Tabler Icons** (`@tabler/icons-react`).
- Jangan mencampuradukkan impor dari kedua library tersebut di dalam satu file komponen.
