// Tes kirim email via SMTP Gmail (untuk verifikasi app password)
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';

const raw = readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
const env = {};
for (const line of raw.split('\n')) {
	const m = line.match(/^([A-Z_]+)=(.*)$/);
	if (m) env[m[1]] = m[2];
}

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: { user: env.SMTP_GMAIL_USER, pass: env.SMTP_GMAIL_APP_PASSWORD }
});

try {
	const info = await transporter.sendMail({
		from: `"BPM FIA UI" <${env.SMTP_GMAIL_USER}>`,
		to: 'stvd2316@gmail.com',
		subject: 'Tes SMTP BPM FIA UI',
		text: 'Kalau kamu melihat email ini, SMTP berfungsi!'
	});
	console.log('TERKIRIM OK:', info.messageId);
} catch (e) {
	console.log('GAGAL:', e.message);
}
