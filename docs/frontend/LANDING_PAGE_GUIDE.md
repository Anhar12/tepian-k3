# Panduan Komponen & Arsitektur Landing Page (`LANDING_PAGE_GUIDE.md`)

Dokumen ini menjelaskan arsitektur, pola komponen interaktif, serta standar desain halaman utama (_landing page_) aplikasi **TEPIAN K3** (`apps/web/src/routes/index.tsx`).

---

## 📌 Ringkasan Komponen Utama

| Komponen / Bagian          | File Source                                  | Keterangan Fitur & Desain                                                    |
| -------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| **Hero Banner Carousel**   | `apps/web/src/routes/index.tsx`              | Carousel gambar interaktif dengan _hover-only_ controls & autoplay pause     |
| **Pusat Layanan**          | `apps/web/src/routes/index.tsx`              | Card 3D badge untuk 4 layanan utama (Pengujian, Pelatihan, Ukom, Konsultasi) |
| **Tentang Kami**           | `apps/web/src/routes/index.tsx`              | Profil Balai K3 Samarinda dengan layout simetris                             |
| **Infografis & Statistik** | `apps/web/src/routes/index.tsx`              | Card ringkasan total pengujian, pelatihan, & uji kompetensi                  |
| **Peta Kalimantan**        | `apps/web/src/components/kalimantan-map.tsx` | Peta SVG interaktif dengan tooltip realtime di atas kursor                   |
| **Berita & Update**        | `apps/web/src/routes/index.tsx`              | Banner berita utama & grid kartu berita terkini                              |
| **FAQ (Tanya Jawab)**      | `apps/web/src/routes/index.tsx`              | Accordion pertanyaan yang sering diajukan                                    |

---

## 🎠 1. Hero Banner Carousel & Hover Controls

### Arsitektur & Perilaku:

1. **Embla Autoplay Integration**:
   - Autoplay berjalan otomatis berganti slide setiap 5 detik (`Autoplay({ delay: 5000 })`).
   - Saat kursor mouse masuk ke area banner (_hover_), autoplay **diberhentikan sementara** agar pengguna nyaman membaca teks. Saat kursor keluar, autoplay berjalan kembali.
   - Penghentian autoplay dilakukan dengan mengakses _instance_ plugin Embla secara tipe aman:
     ```typescript
     const autoplay = api?.plugins()?.autoplay as
       | { stop?: () => void; reset?: () => void }
       | undefined;
     autoplay?.stop(); // saat mouse enter
     autoplay?.reset(); // saat mouse leave
     ```

2. **Hover-Only Navigation Controls**:
   - Tombol navigasi panah kiri/kanan (`ChevronLeft`, `ChevronRight`) dan nomor navigator indikator slide **hanya muncul saat banner di-hover**.
   - Diimplementasikan menggunakan Tailwind CSS `group/hero` pada container dan `opacity-0 group-hover/hero:opacity-100 transition-opacity` pada tombol navigasi.

3. **Tombol Panah Custom**:
   - Menggunakan tombol `Button` custom berukuran `size-10 rounded-full bg-white/30 backdrop-blur-md` yang diposisikan di tengah vertikal sisi kiri (`left-4`) dan kanan (`right-4`).

4. **Pengaturan Jumlah Slide dari Back-Office (Configurable Banner Count)**:
   - Jumlah maksimal kartu banner yang ditampilkan dapat diatur secara fleksibel melalui Pengaturan Landing Page di Back-Office (`landing_settings`).
   - Admin dapat memilih untuk menampilkan semua banner aktif atau membatasinya ke jumlah tertentu (misalnya default 3 slide).

5. **Penjagaan Posisi Slide saat Navigasi (Session State Persistence)**:
   - Indeks slide terakhir yang dibuka pengguna disimpan di `sessionStorage` (`hero-carousel-active-index`).
   - Saat pengguna berpindah halaman atau mengolah tab lain lalu kembali ke Landing Page, carousel akan otomatis memuat slide terakhir yang sedang ia lihat tanpa kembali ke slide pertama.

---

## 🗺️ 2. Komponen Peta Kalimantan Interaktif (`KalimantanMap`)

### File Component: `apps/web/src/components/kalimantan-map.tsx`

Peta Kalimantan dibangun menggunakan elemen **SVG interaktif** yang menampilkan 5 wilayah provinsi kerja Balai K3 Samarinda:

- `kalimantan_barat`
- `kalimantan_utara`
- `kalimantan_timur` (Samarinda)
- `kalimantan_tengah`
- `kalimantan_selatan`

### Perhitungan Posisi Tooltip Presisi Di Atas Kursor:

Untuk mencegah tooltip "melompat" atau muncul di sudut yang salah, perhitungan koordinat kursor dilakukan relatif terhadap pembungkus `containerRef` (`<div>`), bukan relatif terhadap elemen `<path>` individu:

```typescript
const containerRef = useRef<HTMLDivElement>(null);

const handleMouseMove = (e: React.MouseEvent<SVGElement>, key: string) => {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  setTooltipPos({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  });
  setHoveredKey(key);
};
```

Tooltip diposisikan melayang tepat di atas titik kursor menggunakan CSS:

```tsx
<div
  className="pointer-events-none absolute z-30 flex flex-col gap-0.5 rounded-xl bg-slate-900/90 px-3.5 py-2 text-xs text-white shadow-2xl backdrop-blur-md"
  style={{
    left: `${tooltipPos.x}px`,
    top: `${tooltipPos.y - 8}px`,
    transform: "translate(-50%, -100%)", // Memastikan tooltip tepat berada di atas kursor
  }}
>
  ...
</div>
```

### Layout Responsif:

Pada layar desktop/laptop (`lg:`), kontainer Peta Kalimantan mengambil alokasi lebar **60%** (`lg:w-3/5`) dan tabel sebaran perusahaan mengambil **40%** (`lg:w-2/5`) agar peta tampil besar, jernih, dan dominan.

---

## 🎨 3. Standar Typography Responsive Heading (`h2`)

Untuk memberikan pengalaman pengguna terbaik (**Best UX**) pada layar laptop standar (13"–16") serta monitor desktop, seluruh judul section utama (`h2`) menggunakan ukuran skala yang seragam:

### Aturan Skala Font `h2`:

```tsx
<h2 className="mb-2 text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
  Judul Section Utama
</h2>
```

- **Mobile (`<768px`)**: `text-3xl` (30px)
- **Laptop / Tablet (`md: >=768px`)**: `text-4xl` (36px) — _Ukuran ideal yang nyaman dibaca tanpa mengganggu komposisi layout laptop._
- **Monitor Desktop Besar (`lg: >=1024px`)**: `text-5xl` (48px)

### Hiasan Underline Line (`accent-linear`):

Setiap judul section utama dihiasi dengan garis bawah bertema gradient:

```tsx
<div className="mx-auto flex w-fit flex-col items-center gap-2">
  <h2 className="mb-2 text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
    Judul Section
  </h2>
  <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
</div>
```

---

## 💡 Petunjuk untuk Developer Junior & AI Agent

1. **Menambah Section Baru**: Jika menambah section baru pada landing page, gunakan pembungkus judul `mx-auto flex w-fit flex-col items-center gap-2` dengan `h2` berukuran `text-3xl md:text-4xl lg:text-5xl` agar konsisten.
2. **Mengubah Map SVG**: Jika mengubah bentuk atau koordinat SVG Kalimantan, pastikan `ref={containerRef}` tetap terpasang pada `<div>` pembungkus paling luar agar tooltip tetap presisi.
3. **Uji Tipe Typescript**: Selalu jalankan `pnpm check-types` setelah melakukan perubahan pada file `index.tsx` atau komponen terkait.
