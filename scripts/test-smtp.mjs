// Tes kirim email via SMTP (Brevo/Gmail) — baca .env.local
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';

const raw = readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
const env = {};
for (const line of raw.split('\n')) {
	const m = line.match(/^([A-Z_]+)=(.*)$/);
	if (m) env[m[1]] = m[2];
}

const host = env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
	host,
	port,
	secure: port === 465,
	auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

try {
	const info = await transporter.sendMail({
		from: `"BPM FIA UI" <${env.SMTP_USER}>`,
		to: env.TEST_RECEIVER || env.SMTP_USER,
		subject: 'Tes SMTP BPM FIA UI',
		text: 'Kalau kamu melihat email ini, SMTP berfungsi!'
	});
	console.log('TERKIRIM OK:', info.messageId);
} catch (e) {
	console.log('GAGAL:', e.message);
}
