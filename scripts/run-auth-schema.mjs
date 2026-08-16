// Jalankan schema Better Auth ke Supabase Postgres (sekali saja).
// Usage: node scripts/run-auth-schema.mjs
import pg from 'pg';
import { readFileSync } from 'node:fs';

// load .env.local (format CRLF-safe, tanpa dotenv)
const envRaw = readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
for (const line of envRaw.split('\n')) {
	const m = line.match(/^([A-Z_]+)=(.*)$/);
	if (m) process.env[m[1]] = m[2];
}

const sql = readFileSync('supabase-auth-schema.sql', 'utf-8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
console.log('Schema OK — tabel:', (await client.query(
	`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('user','session','account','verification') ORDER BY tablename`
)).rows.map((r) => r.tablename).join(', '));
await client.end();
