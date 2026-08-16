// Ambil OTP terbaru dari tabel verification (tes lokal)
import { readFileSync } from 'node:fs';
import pg from 'pg';

const raw = readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
let db = '';
for (const line of raw.split('\n')) {
	const m = line.match(/^DATABASE_URL=(.*)$/);
	if (m) db = m[1];
}

const c = new pg.Client({ connectionString: db });
await c.connect();
const r = await c.query(
	'SELECT identifier, value, "expiresAt" FROM verification ORDER BY "createdAt" DESC LIMIT 3'
);
for (const row of r.rows) {
	console.log(JSON.stringify({ id: row.identifier, val: String(row.value).slice(0, 24), exp: row.expiresAt }));
}
await c.end();
