import fs from 'node:fs';
import pg from 'pg';

const env = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const pool = new pg.Pool({
	connectionString: env.match(/^DATABASE_URL=(.+)$/m)[1].trim(),
	ssl: { rejectUnauthorized: false }
});

const BULAN = { Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6, Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12 };

const lines = fs.readFileSync('C:/Users/Administrator/Downloads/iss.md', 'utf8').replace(/\r/g, '').split('\n');
const rows = [];
for (const ln of lines) {
	if (!ln.startsWith('|') || ln.includes('---') || ln.includes('Tanggal')) continue;
	const c = ln.split('|').map((s) => s.trim());
	if (c.length < 6) continue;
	const [tgl, , ltk, pj, acara] = [c[1], c[2], c[3], c[4], c[5]];
	const m = tgl.match(/(\d+)\s+(\w+)\s+(\d{4})/);
	if (!m || !acara) continue;
	rows.push({
		date_key: `${parseInt(m[1])}-${BULAN[m[2]]}-${m[3]}`,
		title: acara,
		ltk: ltk,
		pj: pj === '-' ? '' : pj
	});
}
console.log('BARIS FILE:', rows.length);

const ada = await pool.query(`select count(*)::int c from iss_events`);
console.log('ISI TABEL SEKARANG:', ada.rows[0].c);

let n = 0;
for (const r of rows) {
	await pool.query(
		`insert into iss_events
			(date_key, title, description, ltk_penyelenggara, tempat, waktu_mulai, waktu_selesai, penanggungjawab, file_urls)
		 values ($1,$2,'',$3,'','','',$4,'{}')`,
		[r.date_key, r.title, r.ltk, r.pj]
	);
	n++;
}
console.log('TERINSERT:', n);

const dist = await pool.query(
	`select date_key, count(*)::int c from iss_events group by date_key order by count(*) desc limit 5`
);
console.log('TOP TANGGAL:', JSON.stringify(dist.rows));
const cek = await pool.query(
	`select date_key, title, ltk_penyelenggara, penanggungjawab from iss_events
	 where date_key='22-9-2026' order by title`
);
console.log('SPOT 22-9:', JSON.stringify(cek.rows));
await pool.end();
