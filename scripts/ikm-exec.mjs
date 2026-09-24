import fs from 'node:fs';
import pg from 'pg';

const env = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const pool = new pg.Pool({
	connectionString: env.match(/^DATABASE_URL=(.+)$/m)[1].trim(),
	ssl: { rejectUnauthorized: false }
});

const normNilai = (v) => {
	v = (v || '').trim();
	if (!v) return null;
	if (v.includes('.')) return Math.round(parseFloat(v) * 100) / 100;
	const d = v.replace(/\D/g, '').slice(0, 4).padEnd(4, '0');
	return parseInt(d.slice(0, 2)) + parseInt(d.slice(2, 4)) / 100;
};

const lines = fs.readFileSync('C:/Users/Administrator/Downloads/status ikm.csv', 'utf8').replace(/\r/g, '').trim().split('\n');
const updates = new Map(); // key: namaLower||jurusan -> {nama, jurusan, nilai}
for (const ln of lines) {
	if (!ln.trim()) continue;
	const [nama, jur, nil] = ln.split(';').map((s) => (s || '').trim());
	const nilai = normNilai(nil);
	if (nilai === null) continue;
	const jurusan = jur.replace(/^Ilmu Administrasi\s+/i, '');
	updates.set(nama.toLowerCase().trim() + '||' + jurusan, { nama, jurusan, nilai });
}
// Koreksi manual terverifikasi user
updates.set('tapdila rahmania||fiskal', { nama: 'Tapdila Rahmania', jurusan: 'Fiskal', nilai: 93.28 });
updates.delete('calla hawra nafeeza||negara'); // jurusan DB Niaga → lewati
updates.delete('athallah zaidan akbari||fiskal'); // tidak ada di DB → lewati
console.log('KANDIDAT UPDATE:', updates.size);

await pool.query(`drop table if exists status_ikm_backup_20260919`);
await pool.query(`create table status_ikm_backup_20260919 as select * from status_ikm_fia_ui`);
console.log('BACKUP OK');

let n = 0;
const skipGanda = 'marcella nadya olivia||fiskal';
for (const u of updates.values()) {
	const status = u.nilai >= 85 ? 'AKTIF' : 'PASIF';
	let res;
	if (u.nama.toLowerCase() === 'marcella nadya olivia') {
		res = await pool.query(
			`update status_ikm_fia_ui set "Nilai"=$1, "Status"=$2
			 where lower("Nama Lengkap")=lower($3) and "Jurusan"=$4 and "No"=276`,
			[u.nilai, status, u.nama, u.jurusan]
		);
	} else {
		res = await pool.query(
			`update status_ikm_fia_ui set "Nilai"=$1, "Status"=$2
			 where lower("Nama Lengkap")=lower($3) and "Jurusan"=$4`,
			[u.nilai, status, u.nama, u.jurusan]
		);
	}
	n += res.rowCount;
}
console.log('BARIS TERUPDATE:', n);

// Verifikasi: distribusi + contoh berubah status
const st = await pool.query(
	`select "Status", count(*)::int c, min("Nilai") mn, max("Nilai") mx
	 from status_ikm_fia_ui group by "Status" order by "Status"`
);
console.log('DISTRIBUSI:', JSON.stringify(st.rows));
const cek = await pool.query(
	`select "No", "Nama Lengkap", "Jurusan", "Nilai", "Status" from status_ikm_fia_ui
	 where "Nama Lengkap" in ('Tapdila Rahmania','Ravi Maulana Pratama','Qurrotu ''Aini','Marcella Nadya Olivia','Mutiara Putri Athaillah')
	 order by "No"`
);
console.log('SPOT CHECK:', JSON.stringify(cek.rows));
await pool.end();
