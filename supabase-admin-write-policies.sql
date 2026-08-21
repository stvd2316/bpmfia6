-- Policy tulis untuk tabel konten (perbaikan RLS)
-- Cara pakai: dashboard Supabase → SQL Editor → paste semua baris ini → Run.
--
-- Latar: semua operasi tulis di website berjalan langsung dari browser via
-- publishable key (role anon). Tabel konten hanya punya policy SELECT publik,
-- sehingga INSERT/UPDATE/DELETE ditolak RLS ("new row violates row-level
-- security policy"). Policy berikut mengizinkan tulis untuk anon & authenticated,
-- mengikuti arsitektur website (CRUD admin client-side).
-- Idempotent: DROP + CREATE, aman dijalankan ulang.

-- ============ iss_events (kalender ISS) ============
DROP POLICY IF EXISTS "iss_events tulis publik" ON "iss_events";
CREATE POLICY "iss_events tulis publik" ON "iss_events"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "iss_events ubah publik" ON "iss_events";
CREATE POLICY "iss_events ubah publik" ON "iss_events"
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "iss_events hapus publik" ON "iss_events";
CREATE POLICY "iss_events hapus publik" ON "iss_events"
  FOR DELETE TO anon, authenticated USING (true);

-- ============ peraturan (JDIH) ============
DROP POLICY IF EXISTS "peraturan tulis publik" ON "peraturan";
CREATE POLICY "peraturan tulis publik" ON "peraturan"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "peraturan ubah publik" ON "peraturan";
CREATE POLICY "peraturan ubah publik" ON "peraturan"
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "peraturan hapus publik" ON "peraturan";
CREATE POLICY "peraturan hapus publik" ON "peraturan"
  FOR DELETE TO anon, authenticated USING (true);

-- ============ berita ============
DROP POLICY IF EXISTS "berita tulis publik" ON "berita";
CREATE POLICY "berita tulis publik" ON "berita"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "berita ubah publik" ON "berita";
CREATE POLICY "berita ubah publik" ON "berita"
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "berita hapus publik" ON "berita";
CREATE POLICY "berita hapus publik" ON "berita"
  FOR DELETE TO anon, authenticated USING (true);

-- ============ status_ikm_fia_ui (edit nilai IKM) ============
DROP POLICY IF EXISTS "ikm ubah publik" ON "status_ikm_fia_ui";
CREATE POLICY "ikm ubah publik" ON "status_ikm_fia_ui"
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ikm hapus publik" ON "status_ikm_fia_ui";
CREATE POLICY "ikm hapus publik" ON "status_ikm_fia_ui"
  FOR DELETE TO anon, authenticated USING (true);