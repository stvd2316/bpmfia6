-- ============================================================================
-- MIGRASI KEAMANAN RLS — bpmfiauwiw
-- ============================================================================
-- Menutup celah kritis: sebelumnya policy RLS `ALL TO public` mengizinkan
-- SIAPA PUN (tanpa login) INSERT/UPDATE/DELETE pada peraturan, berita,
-- iss_events, status_ikm_fia_ui via REST API Supabase (publishable key).
--
-- Setelah migrasi ini:
--   * Publik  : HANYA SELECT (baca) pada keempat tabel.
--   * Admin   : SEMUA tulis lewat endpoint /api/admin-data di server
--               (koneksi server pakai role postgres, BYPASSRLS = tetap jalan).
--
-- CARA PAKAI: jalankan seluruh isi file ini SEKALI di Supabase SQL Editor.
-- Aman dijalankan ulang (idempotent): drop policy lama & buat ulang yang baru.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PERATURAN: hanya baca untuk publik
-- ----------------------------------------------------------------------------
drop policy if exists "Enable all access for peraturan" on public.peraturan;
create policy "Peraturan hanya bisa dibaca publik"
  on public.peraturan for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- 2. BERITA: hanya baca untuk publik
-- ----------------------------------------------------------------------------
drop policy if exists "Enable all access for berita" on public.berita;
create policy "Berita hanya bisa dibaca publik"
  on public.berita for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- 3. ISS_EVENTS: hanya baca untuk publik (hapus semua policy tulis)
-- ----------------------------------------------------------------------------
drop policy if exists "Enable all access for iss_events" on public.iss_events;
drop policy if exists "Allow delete ISS" on public.iss_events;
drop policy if exists "Allow insert ISS" on public.iss_events;
drop policy if exists "Allow read ISS" on public.iss_events;
drop policy if exists "Enable delete for all users" on public.iss_events;
drop policy if exists "Enable insert for all users" on public.iss_events;
drop policy if exists "Enable read access for all users" on public.iss_events;
create policy "ISS hanya bisa dibaca publik"
  on public.iss_events for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- 4. STATUS_IKM: baca publik; tulis HANYA lewat server (hapus policy update publik)
-- ----------------------------------------------------------------------------
drop policy if exists "Allow update IKM" on public.status_ikm_fia_ui;
drop policy if exists "Enable read access for all users" on public.status_ikm_fia_ui;
create policy "IKM hanya bisa dibaca publik"
  on public.status_ikm_fia_ui for select to anon, authenticated using (true);

-- ============================================================================
-- SELESAI. Verifikasi (opsional):
--   select tablename, policyname, cmd from pg_policies
--   where schemaname='public' and tablename in
--   ('peraturan','berita','iss_events','status_ikm_fia_ui') order by tablename;
-- Seharusnya hanya ada policy SELECT untuk tiap tabel.
-- ============================================================================
