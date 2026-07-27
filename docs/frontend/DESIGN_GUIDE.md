# Frontend Design Guide — tepian-k3

> **Wajib dibaca** oleh semua developer dan AI agents sebelum menyentuh kode frontend.
> Dokumen ini mendefinisikan standar visual, tata letak, dan komponen UI
> yang harus dipatuhi secara konsisten di seluruh aplikasi web.

---

## Daftar Isi

1. [Design Philosophy](#design-philosophy)
2. [Design System & Token](#design-system--token)
3. [Typography](#typography)
4. [Color Palette & Usage](#color-palette--usage)
5. [Component Library (shadcn/ui)](#component-library-shadcnui)
6. [Layout Patterns](#layout-patterns)
7. [Responsive Design](#responsive-design)
8. [Animation & Micro-Interactions](#animation--micro-interactions)
9. [Image & Media Handling](#image--media-handling)
10. [Public Landing Pages](#public-landing-pages)
11. [Back-Office Admin Pages](#back-office-admin-pages)
12. [Form Design Standards](#form-design-standards)
13. [Accessibility (a11y)](#accessibility-a11y)
14. [Performance](#performance)
15. [Dark Mode](#dark-mode)
16. [Anti-Patterns (Hindari)](#anti-patterns-hindari)

---

## Design Philosophy

tepian-k3 menggunakan pendekatan **professional-grade corporate design** yang:

- **Clean & Modern** — Bersih, banyak whitespace, tidak ramai
- **Data-Driven** — Prioritaskan informasi, minimalisir dekorasi yang tidak fungsional
- **Consistent** — Semua halaman memiliki ritme visual yang sama
- **Accessible** — Memenuhi standar kontras WCAG 2.1 AA
- **Performance-First** — Lazy load images, minimal DOM, efisien re-renders

> **Prinsip Utama:** Setiap elemen visual harus punya tujuan fungsional. Hindari dekorasi yang tidak menambah value bagi user.

---

## Design System & Token

### CSS Variables (Design Token)

Semua warna, radius, dan spacing didefinisikan sebagai CSS Custom Properties di [`apps/web/src/index.css`](../apps/web/src/index.css). **Jangan pernah hardcode warna** — selalu gunakan token.

```css
/* Contoh penggunaan token di Tailwind */
className="bg-primary text-primary-foreground"
className="border-border"
className="text-muted-foreground"
```

### Token Utama

| Token                 | Light Mode                 | Penggunaan                        |
| --------------------- | -------------------------- | --------------------------------- |
| `--background`        | `oklch(0.98 0.005 259)`   | Background halaman                |
| `--foreground`        | `oklch(0.25 0.02 259)`    | Teks utama                        |
| `--primary`           | `oklch(0.5208 0.1943 259)` | Brand color (biru tepian-k3)      |
| `--muted`             | `oklch(0.95 0.015 259)`   | Background subtle/secondary       |
| `--muted-foreground`  | `oklch(0.5 0.03 259)`     | Teks secondary/hint               |
| `--destructive`       | `oklch(0.577 0.245 27)`   | Error/danger                      |
| `--accent`            | `oklch(0.92 0.04 259)`    | Highlight, hover states           |
| `--border`            | `oklch(0.9 0.02 259)`     | Border/divider                    |
| `--sidebar`           | `#1e53a4`                 | Sidebar background                |

### Radius System

```css
--radius: 0.625rem;        /* 10px — base radius */
--radius-sm: 6px;          /* Small elements */
--radius-md: 8px;          /* Medium elements */
--radius-lg: 10px;         /* Cards, dialogs */
--radius-xl: 14px;         /* Large cards, hero sections */
```

> **Rule:** Gunakan `rounded-lg` atau `rounded-xl` untuk cards. Gunakan `rounded-md` untuk input fields dan buttons. Jangan gunakan `rounded-full` kecuali untuk avatar dan badge.

---

## Typography

### Font Family

| Font          | Penggunaan                           | Import                 |
| ------------- | ------------------------------------ | ---------------------- |
| **Poppins**   | Font utama (`--font-sans`)           | Google Fonts via CSS   |
| **Plus Jakarta Sans** | Heading hero landing pages   | `font-['Plus Jakarta Sans']` |

### Font Scale (Tailwind Classes)

| Element           | Class           | Size   | Weight       |
| ----------------- | --------------- | ------ | ------------ |
| Hero Heading      | `text-4xl md:text-5xl` | 36-48px | `font-extrabold` (800) |
| Section Heading   | `text-2xl md:text-3xl` | 24-30px | `font-bold` (700)      |
| Card Title        | `text-lg`       | 18px   | `font-semibold` (600)  |
| Body Text         | `text-base`     | 16px   | `font-normal` (400)    |
| Small/Caption     | `text-sm`       | 14px   | `font-normal` (400)    |
| Badge/Label       | `text-xs`       | 12px   | `font-medium` (500)    |

### Rules

- **Jangan gunakan** `font-['Inter']` atau font selain Poppins/Plus Jakarta Sans
- **Line height** gunakan Tailwind default (`leading-snug`, `leading-relaxed`)
- **Letter spacing** gunakan `tracking-tight` untuk heading, `tracking-normal` untuk body
- **Heading hierarchy** wajib: satu `<h1>` per halaman, diikuti `<h2>`, `<h3>` dst.

---

## Color Palette & Usage

### Brand Colors

| Nama              | Tailwind Class          | Hex/OKLCH                  | Penggunaan                  |
| ----------------- | ----------------------- | -------------------------- | --------------------------- |
| Primary Blue      | `bg-primary`            | `oklch(0.5208 0.1943 259)` | CTA utama, link, brand      |
| Sidebar Blue      | `bg-[#1e53a4]`          | `#1e53a4`                  | Sidebar background           |
| Accent Blue       | `bg-[#1061d6]`          | `#1061d6`                  | Active states, sidebar hover |

### Semantic Colors

| Semantik     | Tailwind Class         | Penggunaan                    |
| ------------ | ---------------------- | ----------------------------- |
| Success      | `text-emerald-600`     | Status berhasil, badge aktif  |
| Warning      | `text-amber-500`       | Peringatan, status pending    |
| Error        | `text-destructive`     | Error state, tombol hapus     |
| Info         | `text-sky-500`         | Informasi, link sekunder      |

### Landing Page Section Colors

| Section                | Background                              | Text             |
| ---------------------- | --------------------------------------- | ---------------- |
| Hero Banner            | Dynamic image + overlay                 | `text-white`     |
| Katalog Pelatihan      | `bg-white` / `bg-gray-50`              | `text-foreground`|
| In-House / CTA Banner  | `bg-gradient-to-r from-sky-900 to-sky-700` | `text-white` |
| FAQ                    | `bg-white`                              | `text-foreground`|
| Stats/Counter          | `bg-primary` gradient                   | `text-white`     |

### Aturan Warna

1. **Jangan gunakan** warna Tailwind mentah (`bg-blue-500`) di halaman admin — gunakan token (`bg-primary`)
2. **Boleh gunakan** warna Tailwind spesifik di landing page untuk desain custom (mis. `bg-sky-900`, `bg-amber-500`)
3. **Kontras minimum** untuk teks di atas background gelap: rasio 4.5:1 (WCAG AA)
4. **Opacity** gunakan untuk subtle overlays: `bg-black/40`, `bg-white/10` — jangan buat teks dengan opacity rendah

---

## Component Library (shadcn/ui)

### Penggunaan Komponen

Semua komponen UI dasar diimpor dari `@/components/ui/`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
```

### Rules

- **Jangan buat komponen UI custom** jika shadcn/ui sudah menyediakan (Button, Dialog, Table, dll)
- **Jangan override** style default shadcn/ui secara inline — extend via `className` prop
- **Gunakan** `variant` prop yang tersedia (mis. `<Button variant="destructive">`)
- **Untuk ikon** gunakan Lucide React (`lucide-react`) atau Tabler Icons (`@tabler/icons-react`)
- **Jangan campur** Lucide dan Tabler dalam satu file — pilih salah satu per file

### Komponen Custom yang Sudah Ada

| Komponen               | Path                              | Penggunaan                |
| ----------------------- | --------------------------------- | ------------------------- |
| `ImageWithFallback`     | `@/components/image-with-fallback`| Image dengan fallback     |
| `SingleImageUpload`     | `@/components/ui/single-image-upload` | Upload gambar         |
| `Navbar`                | `@/components/navbar`             | Navbar public pages       |
| `Spinner`               | `@/components/ui/spinner`         | Loading indicator         |
| `Field`, `FieldLabel`   | `@/components/ui/field`           | Form field wrapper        |

---

## Layout Patterns

### Page Wrapper (Back-Office)

```tsx
<div className="space-y-6 p-4 md:p-6">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Judul Halaman</h1>
      <p className="text-muted-foreground">Deskripsi singkat halaman</p>
    </div>
    <Button>Aksi Utama</Button>
  </div>

  {/* Content */}
  <Card>
    <CardContent className="p-6">
      {/* Isi */}
    </CardContent>
  </Card>
</div>
```

### Section Wrapper (Landing Page)

```tsx
<section className="py-16 md:py-24">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Section Header */}
    <div className="mb-12 text-center">
      <Badge variant="outline" className="mb-4">Label</Badge>
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
        Judul Section
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
        Deskripsi section
      </p>
    </div>

    {/* Grid Content */}
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Cards */}
    </div>
  </div>
</section>
```

### Grid System

| Layout        | Class                                       | Penggunaan                  |
| ------------- | ------------------------------------------- | --------------------------- |
| 2 columns     | `grid gap-6 sm:grid-cols-2`                 | Form 2 kolom, card pairs    |
| 3 columns     | `grid gap-6 sm:grid-cols-2 md:grid-cols-3`  | Card grid medium            |
| 4 columns     | `grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | Katalog pelatihan |
| 12-col flex   | `grid md:grid-cols-12` + `md:col-span-X`    | Complex layouts             |

---

## Responsive Design

### Breakpoints (Tailwind 4 Default)

| Breakpoint | Min Width | Penggunaan                     |
| ---------- | --------- | ------------------------------ |
| `sm:`      | 640px     | Tablet portrait, 2 columns     |
| `md:`      | 768px     | Tablet landscape, show sidebar |
| `lg:`      | 1024px    | Desktop, full layout           |
| `xl:`      | 1280px    | Wide desktop, max-width        |
| `2xl:`     | 1536px    | Ultra-wide                     |

### Rules

1. **Mobile-first** — Selalu mulai dari mobile, lalu tambahkan `sm:`, `md:`, `lg:`
2. **Max width** — Content area selalu dibatasi `max-w-7xl` atau `max-w-6xl`
3. **Padding** — `px-4 sm:px-6 lg:px-8` untuk page padding
4. **Hide/Show** — `hidden md:block` untuk sidebar; `md:hidden` untuk mobile menu
5. **Font scaling** — Heading `text-2xl md:text-3xl lg:text-4xl`
6. **Stack → Grid** — Mobile stack vertical, desktop grid horizontal

### Pola Responsive Landing Page

```tsx
{/* Mobile: stack, Desktop: 2 columns */}
<div className="grid items-center gap-8 md:grid-cols-12">
  <div className="space-y-6 md:col-span-7">
    {/* Text content */}
  </div>
  <div className="hidden md:col-span-5 md:block">
    {/* Image/illustration */}
  </div>
</div>
```

---

## Animation & Micro-Interactions

### Transisi Standar

```tsx
{/* Hover scale */}
className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"

{/* Hover shadow lift */}
className="transition-shadow duration-300 hover:shadow-lg"

{/* Opacity transition (slide/carousel) */}
className="transition-opacity duration-700 ease-in-out"

{/* Color transition */}
className="transition-colors duration-200"
```

### Rules

1. **Durasi** — Gunakan `duration-200` untuk hover, `duration-300` untuk transform, `duration-700` untuk slide/fade besar
2. **Easing** — Default `ease-in-out`, gunakan `ease-out` untuk exit animations
3. **Jangan berlebihan** — Maksimal 2 properti animasi per elemen
4. **Scale** — Gunakan `hover:scale-[1.02]` (subtle), jangan `hover:scale-110` (terlalu besar)
5. **Active state** — Selalu tambahkan `active:scale-[0.98]` untuk tombol interaktif
6. **No layout shift** — Jangan animasi `width`, `height`, `padding` — gunakan `transform` dan `opacity`

### Carousel/Slider Pattern

```tsx
{/* Indicator dots */}
<button
  className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
    isActive ? "w-8 bg-amber-500" : "w-2.5 bg-white/40"
  }`}
/>

{/* Slide transition */}
<div
  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
    isActive ? "z-10 opacity-100" : "z-0 opacity-0"
  }`}
/>
```

---

## Image & Media Handling

### Rules

1. **Selalu gunakan** `ImageWithFallback` dari `@/components/image-with-fallback` — bukan `<img>` native
2. **Format** preferensi: WebP > JPEG > PNG
3. **Aspect ratio** gunakan Tailwind `aspect-video` (16:9) atau `aspect-square` (1:1)
4. **Object fit** gunakan `object-cover` untuk gambar fullwidth, `object-contain` untuk logo
5. **Lazy loading** — Semua gambar di bawah fold harus `loading="lazy"`
6. **Alt text** — Wajib deskriptif untuk aksesibilitas, bukan kosong
7. **Upload path** — File uploads via `storageService`, diakses via `getPublicUrl()`

### Image URL Pattern

```typescript
// Gambar dari storage service (uploads)
const imageUrl = getPublicUrl(item.thumbnailUrl);

// Gambar statis dari public folder
const staticImage = "/assets/banner-auth.webp";
```

### Banner / Hero Image Tips (Admin)

Saat admin mengunggah gambar banner untuk landing page:

| Aspek              | Rekomendasi                                    |
| ------------------ | ---------------------------------------------- |
| **Resolusi**       | Minimal 1920×800px (landscape ultra-wide)      |
| **Aspect Ratio**   | 21:9 atau 16:9                                 |
| **Format**         | WebP atau JPEG, max 500KB                      |
| **Konten Gambar**  | Hindari teks dalam gambar — teks overlay di CSS |
| **Overlay**        | Selalu ada dark overlay (`bg-black/40`) agar teks CTA terbaca |
| **Safe Area**      | Konten penting (orang, objek) di 60% tengah, karena crop berbeda per device |

---

## Public Landing Pages

### Pelatihan Landing Page (`/pelatihan`)

Halaman ini terdiri dari section-section berikut:

| #  | Section         | Background              | Dynamic?           |
| -- | --------------- | ----------------------- | ------------------ |
| 1  | Hero Banner     | Carousel 5 gambar       | ✅ Admin editable  |
| 2  | Stats Counter   | Gradient primary        | Hardcoded          |
| 3  | E-Learning      | `bg-white`              | DB + mock fallback |
| 4  | Bimtek          | `bg-gray-50`            | DB + mock fallback |
| 5  | Webinar         | `bg-white`              | DB + mock fallback |
| 6  | In-House CTA    | Gradient sky-900→sky-700| ✅ Banner admin    |
| 7  | FAQ             | `bg-white`              | DB + hardcoded     |
| 8  | Final CTA       | Gradient primary        | Hardcoded          |

### Design Pattern: CTA Banner (In-House Training)

```
┌─────────────────────────────────────────────┐
│  Background: gradient sky-900 → sky-700     │
│  + Gambar background (admin uploadable)     │
│  + Dark overlay untuk kontras teks          │
│                                             │
│  ┌───────────────────┐  ┌──────────────┐   │
│  │ 7 kolom teks      │  │ 5 kolom      │   │
│  │                   │  │ gambar/      │   │
│  │ Heading (48px)    │  │ ilustrasi    │   │
│  │ Plus Jakarta Sans │  │ (desktop)    │   │
│  │ font-extrabold    │  │              │   │
│  │                   │  │              │   │
│  │ Body (20px)       │  └──────────────┘   │
│  │ Poppins regular   │                     │
│  │ white/80 opacity  │                     │
│  │                   │                     │
│  │ [CTA Putih] [CTA Orange]               │
│  └───────────────────┘                     │
└─────────────────────────────────────────────┘
```

### CTA Button Pairs (Landing Page)

Saat ada 2 tombol berdampingan:

```tsx
<div className="flex flex-wrap items-center gap-4">
  {/* Primary CTA — bg putih, teks biru */}
  <Button className="rounded-xl bg-white px-8 py-4 text-sky-500 font-semibold shadow-md
    hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]">
    Hubungi Corporate Sales
  </Button>

  {/* Secondary CTA — bg orange, teks putih + ikon */}
  <button className="px-8 py-4 bg-orange-500 rounded-xl inline-flex justify-center
    items-center gap-2 text-white font-semibold shadow-md
    hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]">
    Download Brosur
    <DownloadIcon />
  </button>
</div>
```

> **PENTING:** Kedua tombol harus **sama tinggi dan padding**. Gunakan `px-8 py-4` yang identik. Jangan biarkan satu tombol lebih besar dari yang lain.

---

## Back-Office Admin Pages

### Layout Standar

Semua halaman admin mengikuti pola:

```
┌──────────────────────────────────────┐
│  Sidebar (240px, bg-sidebar)         │
├──────────────────────────────────────┤
│  Header Bar (breadcrumb + user menu) │
├──────────────────────────────────────┤
│  Page Content (p-4 md:p-6)           │
│  ┌────────────────────────────────┐  │
│  │ Page Title + Actions           │  │
│  ├────────────────────────────────┤  │
│  │ Tabs / Filters (optional)      │  │
│  ├────────────────────────────────┤  │
│  │ Card(s) with content           │  │
│  │ - Table                        │  │
│  │ - Form                         │  │
│  │ - Dashboard widgets            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Admin Pelatihan — Design Tips untuk Upload Banner

Saat admin mengelola banner landing page pelatihan:

1. **Preview real-time** — Tampilkan preview bagaimana banner akan terlihat di halaman publik
2. **Overlay guide** — Tunjukkan dimana teks/CTA akan muncul di atas gambar
3. **Aspect ratio indicator** — Tampilkan rasio yang direkomendasikan (21:9)
4. **File size warning** — Tampilkan peringatan jika file > 500KB
5. **Drag & drop** — Gunakan `SingleImageUpload` yang sudah support drag & drop
6. **Order management** — Gunakan drag-to-reorder untuk urutan banner carousel

### Admin Table Pattern

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Daftar Data</CardTitle>
      <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Tambah</Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* Search + Filters */}
    <div className="mb-4 flex gap-4">
      <Input placeholder="Cari..." className="max-w-sm" />
      {/* Filter dropdowns */}
    </div>

    {/* Table */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Rows */}
      </TableBody>
    </Table>

    {/* Pagination */}
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Menampilkan 1-10 dari 50</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Sebelumnya</Button>
        <Button variant="outline" size="sm">Selanjutnya</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Form Design Standards

### Input Field Pattern

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="title">Judul Pelatihan</FieldLabel>
    <Input id="title" placeholder="Masukkan judul..." {...register("title")} />
    {errors.title && <FieldError>{errors.title.message}</FieldError>}
  </Field>
</FieldGroup>
```

### Rules

1. **Label** wajib di setiap input — gunakan `<FieldLabel>`
2. **Placeholder** berformat "Masukkan..." atau "Pilih..."
3. **Error messages** ditampilkan di bawah input, warna `text-destructive`
4. **Required indicator** — Tambahkan asterisk (*) di label atau gunakan `required` attribute
5. **Form layout** — 1 kolom di mobile, 2 kolom di desktop untuk form pendek
6. **Submit button** — Selalu di kanan bawah form, gunakan loading state saat submitting
7. **Cancel button** — Selalu ada di sebelah kiri submit button

### Dialog/Modal Form Pattern

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Tambah Data Baru</DialogTitle>
      <DialogDescription>Isi form di bawah untuk menambah data.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Accessibility (a11y)

### Rules Wajib

1. **Semantic HTML** — Gunakan `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>` dengan benar
2. **ARIA labels** — Semua ikon button harus punya `aria-label`
3. **Focus visible** — Jangan hapus focus ring (`outline-ring/50` sudah di-set global)
4. **Alt text** — Semua `<img>` harus punya `alt` deskriptif
5. **Keyboard navigation** — Semua interaktif elemen harus bisa diakses via Tab
6. **Color contrast** — Rasio minimal 4.5:1 untuk teks normal, 3:1 untuk teks besar
7. **Skip to content** — Halaman publik wajib punya skip navigation link
8. **Error announcements** — Form errors harus di-announce ke screen reader

---

## Performance

### Rules

1. **Lazy load** images di bawah fold: `loading="lazy"`
2. **Skeleton loaders** — Tampilkan skeleton saat data loading, bukan spinner di tengah halaman
3. **Prefetch** — Gunakan `loader` di TanStack Router untuk data critical path
4. **Code splitting** — TanStack Router otomatis code-split per route
5. **Image optimization** — WebP format, max 500KB untuk banner, 200KB untuk thumbnail
6. **Avoid re-renders** — Gunakan `useMemo` dan `useCallback` untuk expensive computations
7. **Pagination** — Selalu paginate data list, jangan load semua sekaligus

---

## Dark Mode

### Status Saat Ini

Dark mode didukung via CSS variables di `:root` dan `.dark`. Namun **halaman publik** (landing, pelatihan) saat ini **light-only**.

### Rules

- **Back-office** mendukung dark mode via `dark:` prefix
- **Landing pages** desain untuk light mode saja — dark sections pakai gradient/gambar, bukan dark mode
- **Jangan** tambahkan `dark:` classes di halaman landing publik kecuali diminta secara eksplisit

---

---

## Figma Translation & Dynamic Layout Guidelines

Untuk memastikan kepatuhan penuh terhadap estetika premium dan struktur desain di Figma, AI agent dan developer harus mengikuti aturan berikut:

### 1. Ekstraksi Metrik Figma
* **Ketebalan Batas & Radius**: Selalu periksa nilai border-radius (`borderRadius` di JSON Figma) dan border-weight. Layout kartu premium menggunakan `rounded-2xl` (14px) atau `rounded-3xl` (24px) dengan batas abu-abu lembut (`#E7E7E7` atau `border-border`).
* **Bayangan (Shadows)**: Gunakan bayangan bermotif biru/cyan lembut untuk elemen melayang (seperti kartu informasi) untuk merepresentasikan `shadow card (blue)` dari Figma: `shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.06)]`.
* **Lebar & Responsif**: Dimensi lebar tetap (seperti `width: 770px` atau `width: 494px` di desktop) wajib diterjemahkan menjadi kombinasi kolom grid responsif (mis. `grid-cols-1 lg:grid-cols-12`) dengan porsi `lg:col-span-7` dan `lg:col-span-5` agar layout tidak pecah pada perangkat yang lebih kecil.

### 2. Tombol Berpasangan (Symmetry Rules)
* **Tinggi & Padding Seragam**: Tombol primer dan sekunder yang diletakkan berdampingan (seperti tombol "Daftar" dan "Masukkan Keranjang") **WAJIB** memiliki tinggi (`h-12` / `h-14`) dan padding (`px-8 py-4`) yang identik. Hindari ketimpangan visual di mana satu tombol tampak lebih gemuk/tinggi dibanding tombol pasangannya.
* **Warna Kontras Tinggi**: Tombol primer wajib berlatar solid (`bg-[#1061D6]`), tombol sekunder wajib berlatar putih dengan border biru tebal (`border-2 border-[#1061D6] text-[#1061D6]`).
* **Mikro-Interaksi Aktif**: Setiap tombol interaktif harus dibekali efek hover dan aktif: `hover:scale-[1.01] active:scale-[0.98] transition-all duration-300`.

### 3. Penanganan Konten Dinamis (Dynamic States)
* **Collapse/Expand Fold**: Deskripsi panjang (seperti biografi instruktur atau deskripsi detail kelas) tidak boleh memakan ruang halaman secara berlebihan. Sediakan pembatas tinggi maksimal dan tombol toggle fold ("Selengkapnya" / "Sembunyikan") yang dilengkapi transisi rotasi ikon chevron (`svg transform transition-transform duration-300`).
* **Status Terproteksi (Paywall & Restriction State)**: 
  * Area interaktif yang membutuhkan pendaftaran (seperti formulir ulasan untuk user yang belum membeli kursus) harus diburamkan menggunakan kombinasi filter blur (`backdrop-blur-[0.5px]`), pelindung klik (`pointer-events-none`), dan warna latar redup.
  * Tampilkan peringatan yang jelas dan profesional berupa kotak keterangan berwarna kuning/amber lembut (`border-amber-100 bg-amber-50/50 text-amber-700`) bertuliskan informasi restriksi secara eksplisit.
  * Sediakan tombol CTA sekunder yang menuntun user untuk mendaftar atau memicu alur pembelian (mis. scroll ke form pendaftaran).

---

## Anti-Patterns (Hindari)

| ❌ Jangan                                    | ✅ Gunakan                                      |
| ------------------------------------------- | ----------------------------------------------- |
| Hardcode warna: `bg-[#1e53a4]`              | Token: `bg-sidebar` (kecuali di landing pages)  |
| `<img>` native tanpa fallback               | `<ImageWithFallback>`                           |
| Teks putih di background terang             | Pastikan kontras ≥ 4.5:1                        |
| `onClick` di `<div>` tanpa `role="button"`  | Gunakan `<button>` atau `<Button>`              |
| `!important` di inline styles              | Override via Tailwind `className`               |
| Font selain Poppins/Plus Jakarta Sans       | Konsisten dengan design system                  |
| Animasi `width`/`height`                    | Animasi `transform`/`opacity`                   |
| Spinner full-page saat loading              | Skeleton loader per-section                     |
| Inline `style={{...}}` untuk layout         | Tailwind classes (kecuali dynamic values)        |
| Tombol tanpa loading state                  | `disabled={isSubmitting}` + Spinner             |
| Alert/Toast tanpa konteks                   | Pesan jelas: "Pelatihan berhasil ditambahkan"   |
| Tombol berdampingan beda ukuran/tinggi      | Tinggi & padding sama (`h-12 px-8 py-4`)        |
| Menulis teks biografi panjang tanpa fold    | Tombol "Selengkapnya" + Chevron rotasi          |
| Membiarkan form ulasan terbuka untuk non-member | Backdrop blur + Amber warning restriksi + CTA   |

---

## Referensi

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Tabler Icons](https://tabler.io/icons)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [index.css (Design Tokens)](../apps/web/src/index.css)
