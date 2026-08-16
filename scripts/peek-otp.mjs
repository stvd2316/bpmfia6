// Ambil OTP terbaru untuk email tertentu (tes lokal/produksi)
import { readFileSync } from 'node:fs';
import pg from 'pg';

const email = process.argv[2] || 'reformasibpmfiaui@gmail.com';
const raw = readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
let db = '';
for (const line of raw.split('\n')) {
	const m = line.match(/^DATABASE_URL=(.*)$/);
	if (m) db = m[1];
}

const c = new pg.Client({ connectionString: db });
await c.connect();
const r = await c.query(
	'SELECT value FROM verification WHERE identifier = $1 ORDER BY "createdAt" DESC LIMIT 1',
	['sign-in-otp-' + email]
);
if (r.rows.length) {
	console.log('OTP:', String(r.rows[0].value).split(':')[0]);
} else {
	console.log('TIDAK ADA OTP untuk', email);
}
await c.end();
