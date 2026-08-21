// API daftar email admin (dashboard admin):
//   GET    /api/admin-emails              → daftar (publik — untuk validasi login)
//   POST   /api/admin-emails { email }    → tambah admin (butuh sesi admin)
//   DELETE /api/admin-emails { email }    → hapus admin (butuh sesi admin + OTP ulang)
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { listAdminEmails, addAdminEmail, removeAdminEmail, isAdminEmailDb } from '$lib/server/adminStore';

const KALIMAT_KONFIRMASI = 'saya akan menghapus email berikut sebagai admin dan saya sudah memahaminya';

async function getAdminSession(request: Request) {
	const headers = new Headers(request.headers);
	// better-auth membaca cookie dari header — Request sudah membawanya
	const session = await auth.api.getSession({ headers });
	if (!session || !session.user?.email || !(await isAdminEmailDb(session.user.email))) {
		throw error(401, 'Tidak diizinkan — login admin diperlukan.');
	}
	return session;
}

export const GET: RequestHandler = async () => {
	const list = await listAdminEmails();
	return json({ emails: list });
};

export const POST: RequestHandler = async ({ request }) => {
	await getAdminSession(request);
	const body = await request.json().catch(() => ({}));
	const email = String(body.email || '').trim();
	if (!email) throw error(400, 'Email wajib diisi.');
	const result = await addAdminEmail(email);
	if (result === 'exists') throw error(400, 'Email sudah terdaftar sebagai admin.');
	return json({ ok: true, emails: await listAdminEmails() });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const session = await getAdminSession(request);
	const me = session.user.email!;
	const body = await request.json().catch(() => ({}));
	const target = String(body.email || '').trim().toLowerCase();
	const otp = String(body.otp || '').trim();

	if (!target) throw error(400, 'Email wajib diisi.');
	if (target === me) throw error(400, 'Tidak bisa menghapus diri sendiri.');
	if (body.kalimat !== KALIMAT_KONFIRMASI) throw error(400, 'Kalimat konfirmasi tidak sesuai.');
	if (!(await isAdminEmailDb(target))) throw error(400, 'Email tersebut bukan admin.');

	// Fase 1: tanpa OTP → kirim OTP verifikasi ke email admin yang sedang dipakai
	if (!otp) {
		await auth.api.sendVerificationOTP({
			headers: new Headers(request.headers),
			body: { email: me, type: 'sign-in' }
		});
		return json({ needOtp: true });
	}

	// Fase 2: verifikasi OTP (email admin aktif) → hapus
	const check = await auth.api.checkVerificationOTP({
		headers: new Headers(request.headers),
		body: { email: me, otp, type: 'sign-in' }
	});
	if (!check.success) throw error(400, 'Kode OTP salah atau sudah kedaluwarsa.');

	await removeAdminEmail(target);
	return json({ ok: true, emails: await listAdminEmails() });
};
