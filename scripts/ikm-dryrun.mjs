import fs from 'node:fs';
import pg from 'pg';

const env = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const pool = new pg.Pool({
	connectionString: env.match(/^DATABASE_URL=(.+)$/m)[1].trim(),
	ssl: { rejectUnauthorized: false }
});

// Aturan status di DB saat ini
const st = await pool.query(
	`select "Status", count(*)::int c, min("Nilai") mn, max("Nilai") mx
	 from status_ikm_fia_ui group by "Status" order by "Status"`
);
console.log('STATUS SEKARANG:', JSON.stringify(st.rows));

// Parse CSV: No|Nama;Jurusan;Nilai
const lines = fs.readFileSync('C:/Users/Administrator/Downloads/status ikm.csv', 'utf8').replace(/\r/g, '').trim().split('\n');
const normNilai = (v) => {
	v = (v || '').trim();
	if (!v) return null;
	if (v.includes('.')) return Math.round(parseFloat(v) * 100) / 100;
	const d = v.replace(/\D/g, '').slice(0, 4).padEnd(4, '0');
	return parseInt(d.slice(0, 2)) + parseInt(d.slice(2, 4)) / 100;
};

const rows = [];
for (const ln of lines) {
	if (!ln.trim()) continue;
	const [nama, jur, nil] = ln.split(';').map((s) => (s || '').trim());
	const jurusan = jur.replace(/^Ilmu Administrasi\s+/i, '');
	rows.push({ nama, jurusan, nilai: normNilai(nil) });
}

const db = await pool.query(`select "No", "Nama Lengkap" n, "Jurusan" j, "Nilai" nil from status_ikm_fia_ui`);
const byKey = new Map();
for (const r of db.rows) {
	const k = r.n.toLowerCase().trim() + '||' + r.j.trim();
	if (!byKey.has(k)) byKey.set(k, []);
	byKey.get(k).push(r);
}

let ok = 0, pasif = 0;
const notFound = [], multi = [];
const seen = new Set();
for (const r of rows) {
	if (r.nilai === null) continue; // nilai kosong → lewati
	const k = r.nama.toLowerCase().trim() + '||' + r.jurusan;
	const id = k + '||' + r.nilai;
	if (seen.has(id)) continue; // duplikat baris CSV
	seen.add(id);
	const m = byKey.get(k) || [];
	if (m.length === 0) notFound.push(`${r.nama} [${r.jurusan}]`);
	else if (m.length > 1) multi.push(`${r.nama} [${r.jurusan}] x${m.length}`);
	else {
		ok++;
		if (r.nilai < 85) pasif++;
	}
}
console.log('COCOK:', ok, '| PASIF(<85):', pasif, '| AKTIF(>=85):', ok - pasif);
console.log('TIDAK KETEMU:', notFound.length, JSON.stringify(notFound));
console.log('GANDA:', multi.length, JSON.stringify(multi));
await pool.end();
