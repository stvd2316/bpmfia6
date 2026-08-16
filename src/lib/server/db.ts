// Database Kysely untuk Better Auth — pakai Postgres Supabase yang sudah ada.
// DATABASE_URL diisi dari dashboard Supabase: Settings → Database →
// Connection string → URI (atau "Session pooler"). Isi di .env.local dan
// di Environment Variables Vercel (Production).
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from '$env/dynamic/private';

// PENTING: paksa UTC — node-postgres mengirim timestamp sebagai waktu LOKAL
// server (Windows = WIB/UTC+7) tanpa offset → tersimpan salah → semua expiry
// (OTP/sesi) terlihat "kedaluwarsa" 7 jam lebih awal. Dengan TZ=UTC, serialize
// & parse timestamp konsisten dengan now() database.
process.env.TZ = 'UTC';

const connectionString = env.DATABASE_URL;

if (!connectionString || connectionString.startsWith('ISI_')) {
	console.error(
		'[better-auth] DATABASE_URL belum diisi! Ambil dari dashboard Supabase ' +
			'(Settings → Database → Connection string) lalu isi di .env.local & Vercel.'
	);
}

// Pool diekspor agar bisa dipakai langsung (adminStore) & oleh Kysely
export const pool = new pg.Pool({
	connectionString: connectionString && !connectionString.startsWith('ISI_') ? connectionString : undefined,
	max: 10,
	connectionTimeoutMillis: 8000
});

const dialect = new PostgresDialect({ pool });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Kysely<any>({ dialect });
