import fs from 'node:fs';
import pg from 'pg';

const env = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const pool = new pg.Pool({
	connectionString: env.match(/^DATABASE_URL=(.+)$/m)[1].trim(),
	ssl: { rejectUnauthorized: false }
});
const r = await pool.query(
	`delete from status_ikm_fia_ui where "Nama Lengkap"=$1 and "Nilai"=72.22
	 returning "No", "Nama Lengkap", "Jurusan", "Nilai", "Status"`,
	['Marcella Nadya Olivia']
);
console.log('TERHAPUS:', JSON.stringify(r.rows));
const c = await pool.query(`select count(*)::int c from status_ikm_fia_ui`);
console.log('TOTAL SEKARANG:', c.rows[0].c);
await pool.end();
