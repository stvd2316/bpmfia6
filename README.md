# BPM FIA UI — Website Organisasi (JDIH)

Website Badan Perwakilan Mahasiswa Fakultas Ilmu Administrasi Universitas Indonesia.
Dibangun dengan **SvelteKit (Svelte 5 Runes)** — pengganti Next.js/React yang jauh lebih ringan (bundle gzip ~101 KB, termasuk Supabase) sehingga cepat dibuka di HP kelas bawah.

## Stack

| Kebutuhan | Next.js (lama) | SvelteKit (baru) |
|---|---|---|
| Framework | Next.js 16 + React 19 | **SvelteKit 2 + Svelte 5** (SPA murni, `ssr=false`) |
| Database | @supabase/supabase-js | @supabase/supabase-js (sama, langsung dipakai) |
| File storage | @aws-sdk/client-s3 → Cloudflare R2 | @aws-sdk/client-s3 (sama, dipakai di server) |
| CSS | Tailwind (tidak terpakai) + CSS global | CSS global murni (Tailwind dibuang) |
| PDF viewer | iframe via proxy | iframe via proxy (sama) |
| react-pdf | Terpasang tapi **tidak pernah dipakai** | Dihapus |

Semua komponen UI, teks, class CSS, perilaku navigasi hash (`#peraturan`, `#peraturan/:id`, `#berita/:id`, `#about`, `#status-ikm`, `#berita-all`), dan logika CRUD dipertahankan **100% identik** dengan versi Next.js.

## Menjalankan

```bash
npm install        # sekali
npm run dev        # dev server → http://localhost:3000 (host: true → bisa diakses dari HP di LAN)
npm run check      # svelte-check (type checking)
npm run build      # build produksi → ./build (adapter-node)
npm run preview    # preview build produksi
```

### Build produksi (deploy)

```bash
npm run build
PORT=3000 node build/index.js
```

Variabel environment dibaca dari `.env.local` di dev; di produksi set sebagai environment variable
(di Vercel/Railway/Render/dll): `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `ADMIN_USER`, `ADMIN_PASS`.

> Catatan: di dev, Vite otomatis memuat `.env.local`. Untuk menjalankan build produksi di Windows
> (bash), ekspor dulu isi `.env.local`: `export $(grep -v '^#' .env.local | xargs)` atau set manual.

## Struktur

```
src/
  app.html            → layout HTML (title, meta, favicon)
  app.css             → seluruh styling global (port 1:1 dari globals.css)
  lib/
    supabase.ts       → klien Supabase (publishable key)
    components/       → ImageSwiper, LocalImagePreview, TextWithLinks
  routes/
    +layout.ts        → ssr = false (SPA murni)
    +layout.svelte    → import app.css
    +page.svelte      → seluruh UI (port 1:1 dari page.tsx)
    api/
      admin-login/+server.ts   → login admin (env + fallback hardcoded)
      upload-pdf/+server.ts    → upload PDF peraturan ke R2 (maks 500KB)
      upload-files/+server.ts  → upload multi WebP/PDF ke R2 (maks 10 file, 2MB/file)
      download/+server.ts      → proxy download PDF (Content-Disposition + cache 1 tahun)
      image/+server.ts         → proxy gambar R2 (cache 1 tahun untuk HP)
static/
  logobpm.webp        → favicon
  assets/             → gedungfia, kokum, kominfo, pi (webp), line.png
```

## Fitur

- Beranda: hero, statistik dokumen, peraturan terbaru, berita terbaru, kalender ISS
- Semua Peraturan: filter (judul/jenis/tahun/status) + pagination 20/halaman + cache per halaman
- Detail peraturan: info lengkap, view PDF (overlay iframe via proxy), download, riwayat perubahan
- Berita: daftar + detail dengan lampiran WebP/PDF
- Cek Status IKM: pencarian nama (debounce 300ms), edit nilai inline oleh admin, realtime Supabase
- ISS: kalender bulanan, detail acara per tanggal, lampiran, CRUD acara (admin)
- Admin: login via `/api/admin-login`, CRUD peraturan/berita/acara, edit nilai IKM
- About Us: tumpukan kartu foto yang bisa di-swipe (pointer events, rAF)
- Navigasi hash manual via History API (back/forward didukung penuh)

## Deploy di Vercel (opsional)

Jika ingin deploy di Vercel, ganti adapter:

```bash
npm i -D @sveltejs/adapter-vercel
# svelte.config.js → import adapter from '@sveltejs/adapter-vercel'; adapter: adapter()
```

Lalu set environment variables di dashboard Vercel. Untuk Node/VPS gunakan adapter-node (default).
