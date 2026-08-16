// Pengirim email OTP — SMTP Gmail (Nodemailer).
// Kenapa Gmail: Gmail → Gmail TIDAK pernah masuk spam (domain pengirim &
// penerima sama-sama gmail.com yang reputasinya terpercaya), dan gratis.
// Butuh App Password: Google Account → Keamanan → Verifikasi 2 Langkah →
// Kata Sandi Aplikasi → buat untuk "Mail" → tempel ke SMTP_GMAIL_APP_PASSWORD.
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const user = env.SMTP_GMAIL_USER;
const pass = env.SMTP_GMAIL_APP_PASSWORD;

export function smtpSiap(): boolean {
	return !!user && !!pass && !user.startsWith('ISI_') && !pass.startsWith('ISI_');
}

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: { user, pass }
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
	if (!smtpSiap()) {
		console.error('[better-auth] SMTP Gmail belum dikonfigurasi — OTP tidak terkirim.');
		return;
	}
	await transporter.sendMail({
		from: `"BPM FIA UI - Admin" <${user}>`,
		to,
		subject: 'Kode OTP Login Admin BPM FIA UI',
		text: `Kode OTP kamu: ${otp}\n\nKode berlaku 5 menit. Jangan bagikan ke siapa pun.\n\n— BPM FIA UI`,
		html: `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0c; border-radius: 16px; padding: 32px; color: #ffffff;">
	<div style="font-size: 12px; letter-spacing: 2px; color: #f0a500; text-transform: uppercase; margin-bottom: 12px;">BPM FIA UI</div>
	<h2 style="margin: 0 0 8px; font-size: 20px;">Kode OTP Login Admin</h2>
	<p style="color: #c9c9d2; font-size: 14px; line-height: 1.6;">Gunakan kode berikut untuk masuk ke panel admin:</p>
	<div style="margin: 20px 0; padding: 16px; background: #14141a; border-radius: 12px; border: 1px solid #f0a500; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffd155;">${otp}</div>
	<p style="color: #8a8a94; font-size: 12px; line-height: 1.5;">Kode berlaku 5 menit. Jika bukan kamu yang meminta, abaikan email ini.</p>
</div>`
	});
}
