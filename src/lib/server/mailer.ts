// Pengirim email OTP — SMTP generic (Brevo / Gmail / lainnya).
// Env yang dipakai (Vercel & .env.local):
//   SMTP_HOST  (mis. smtp-relay.brevo.com)  — opsional, default smtp.gmail.com
//   SMTP_PORT  (587 untuk Brevo)            — opsional, default 465 (Gmail SSL)
//   SMTP_USER  (login SMTP)
//   SMTP_PASS  (password / SMTP key)
//   SMTP_FROM_NAME — nama pengirim (default "BPM FIA UI")
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const host = env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(env.SMTP_PORT || 465);
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;

export function smtpSiap(): boolean {
	return !!user && !!pass && !user.startsWith('ISI_') && !pass.startsWith('ISI_');
}

export async function sendOtpEmail(to: string, otp: string) {
	if (!smtpSiap()) {
		console.error('[mailer] SMTP belum dikonfigurasi — OTP tidak terkirim!');
		return;
	}
	const transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // 465 = SSL; 587 = STARTTLS
		auth: { user, pass }
	});
	await transporter.sendMail({
		from: `"${env.SMTP_FROM_NAME || 'BPM FIA UI'}" <${user}>`,
		to,
		subject: 'Kode OTP Login Admin BPM FIA UI',
		text: `Kode OTP kamu: ${otp}\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.\n\n— BPM FIA UI`,
		html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e8e2d0;border-radius:12px;overflow:hidden">
  <div style="background:#111114;padding:16px 24px"><span style="color:#ffd155;font-weight:bold;letter-spacing:1px">BPM FIA UI</span></div>
  <div style="padding:24px">
    <p style="color:#222;font-size:15px;line-height:1.6">Kode OTP untuk login Admin:</p>
    <div style="background:#fff8e6;border:1px dashed #f0a500;border-radius:10px;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#111114;margin:12px 0">${otp}</div>
    <p style="color:#666;font-size:13px;line-height:1.6">Kode berlaku <b>5 menit</b>. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari BPM FIA UI.</p>
  </div>
</div>`
	});
}
