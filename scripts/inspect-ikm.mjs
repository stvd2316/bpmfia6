import fs from 'node:fs';
import pg from 'pg';

const env = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const m = env.match(/^DATABASE_URL=(.+)$/m);
if (!m) throw new Error('DATABASE_URL tidak ada');
const pool = new pg.Pool({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });

const cols = await pool.query(
	`select column_name, data_type from information_schema.columns
	 where table_name='status_ikm_fia_ui' order by ordinal_position`
);
console.log('KOLOM:', JSON.stringify(cols.rows));
const n = await pool.query(`select count(*)::int c from status_ikm_fia_ui`);
console.log('TOTAL BARIS:', n.rows[0].c);
const s = await pool.query(`select * from status_ikm_fia_ui limit 3`);
console.log('SAMPLE:', JSON.stringify(s.rows, null, 1).slice(0, 800));
await pool.end();
