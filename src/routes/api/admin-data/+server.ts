// Endpoint server-side untuk semua operasi TULIS data (peraturan, berita, acara, IKM).
// Sebelumnya operasi ini dilakukan langsung dari browser via Supabase publishable key,
// dan policy RLS-nya mengizinkan semua orang (public) menulis — celah kritis.
// Sekarang: browser (baca) tetap Supabase langsung, semua tulis lewat endpoint ini
// yang divalidasi sesi admin. UI tidak berubah.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminSession } from '$lib/server/adminGuard';
import { pool } from '$lib/server/db';

async function run(query: string, params: unknown[]) {
	try {
		const r = await pool.query(query, params);
		return { ok: true, data: r.rows };
	} catch (e: any) {
		console.error('[admin-data]', e?.message);
		return { ok: false, error: 'Operasi gagal.' };
	}
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export const POST: RequestHandler = async ({ request }) => {
	await getAdminSession(request);
	const body = await request.json().catch(() => ({}));
	const action = String(body.action || '');

	if (action === 'peraturan-insert') {
		const res = await run(
			`insert into peraturan
				(judul, jenis_dokumen, tahun, tgl_penetapan, tempat_penetapan, tgl_berlaku, status, perubahan_tipe, perubahan_teks, pdf_url)
			 values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
			[
				str(body.judul),
				str(body.jenis_dokumen),
				str(body.tahun),
				str(body.tgl_penetapan),
				str(body.tempat_penetapan),
				str(body.tgl_berlaku),
				str(body.status),
				str(body.perubahan_tipe),
				str(body.perubahan_teks),
				body.pdf_url == null ? null : str(body.pdf_url)
			]
		);
		return json(res);
	}

	if (action === 'peraturan-update') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const res = await run(
			`update peraturan set
				judul=$1, jenis_dokumen=$2, tahun=$3, tgl_penetapan=$4, tempat_penetapan=$5,
				tgl_berlaku=$6, status=$7, perubahan_tipe=$8, perubahan_teks=$9, pdf_url=$10
			 where id=$11 returning *`,
			[
				str(body.judul),
				str(body.jenis_dokumen),
				str(body.tahun),
				str(body.tgl_penetapan),
				str(body.tempat_penetapan),
				str(body.tgl_berlaku),
				str(body.status),
				str(body.perubahan_tipe),
				str(body.perubahan_teks),
				body.pdf_url == null ? null : str(body.pdf_url),
				id
			]
		);
		return json(res);
	}

	if (action === 'peraturan-delete') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const res = await run('delete from peraturan where id=$1', [id]);
		return json(res);
	}

	if (action === 'berita-insert') {
		const file_urls = Array.isArray(body.file_urls) ? body.file_urls.map(str) : [];
		const res = await run(
			'insert into berita (judul, isi, tgl_terbit, file_urls) values ($1,$2,$3,$4) returning *',
			[str(body.judul), str(body.isi), str(body.tgl_terbit), file_urls]
		);
		return json(res);
	}

	if (action === 'berita-update') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const file_urls = Array.isArray(body.file_urls) ? body.file_urls.map(str) : [];
		const res = await run(
			'update berita set judul=$1, isi=$2, tgl_terbit=$3, file_urls=$4 where id=$5 returning *',
			[str(body.judul), str(body.isi), str(body.tgl_terbit), file_urls, id]
		);
		return json(res);
	}

	if (action === 'berita-delete') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const res = await run('delete from berita where id=$1', [id]);
		return json(res);
	}

	if (action === 'acara-insert') {
		const file_urls = Array.isArray(body.file_urls) ? body.file_urls.map(str) : [];
		const res = await run(
			`insert into iss_events
				(date_key, title, description, ltk_penyelenggara, tempat, waktu_mulai, waktu_selesai, penanggungjawab, file_urls)
			 values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
			[
				str(body.date_key),
				str(body.title),
				str(body.description),
				str(body.ltk_penyelenggara),
				str(body.tempat),
				str(body.waktu_mulai),
				str(body.waktu_selesai),
				str(body.penanggungjawab),
				file_urls
			]
		);
		return json(res);
	}

	if (action === 'acara-update') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const file_urls = Array.isArray(body.file_urls) ? body.file_urls.map(str) : [];
		const res = await run(
			`update iss_events set
				date_key=$1, title=$2, description=$3, ltk_penyelenggara=$4, tempat=$5,
				waktu_mulai=$6, waktu_selesai=$7, penanggungjawab=$8, file_urls=$9
			 where id=$10 returning *`,
			[
				str(body.date_key),
				str(body.title),
				str(body.description),
				str(body.ltk_penyelenggara),
				str(body.tempat),
				str(body.waktu_mulai),
				str(body.waktu_selesai),
				str(body.penanggungjawab),
				file_urls,
				id
			]
		);
		return json(res);
	}

	if (action === 'acara-delete') {
		const id = str(body.id);
		if (!id) return json({ ok: false, error: 'ID tidak valid.' }, { status: 400 });
		const res = await run('delete from iss_events where id=$1', [id]);
		return json(res);
	}

	if (action === 'ikm-update') {
		const no = Number(body.no);
		if (!Number.isFinite(no)) return json({ ok: false, error: 'No tidak valid.' }, { status: 400 });
		const nilai = Number(body.nilai);
		if (!Number.isFinite(nilai)) return json({ ok: false, error: 'Nilai tidak valid.' }, { status: 400 });
		const status = nilai >= 85 ? 'AKTIF' : 'PASIF';
		const res = await run('update status_ikm_fia_ui set "Nilai"=$1, "Status"=$2 where "No"=$3 returning *', [
			nilai,
			status,
			no
		]);
		return json(res);
	}

	return json({ ok: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
};
