// Better Auth — konfigurasi utama (email OTP, sesi 1 jam sliding, cookie session).
import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { sendOtpEmail, smtpSiap } from './mailer';
import { isAdminEmail } from '$lib/adminEmails';

export const auth = betterAuth({
	// $env/dynamic/private: SvelteKit membaca .env.local (dev) & env Vercel (produksi)
	secret: env.BETTER_AUTH_SECRET || 'dev-only-insecure-secret-change-me',
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
	database: kyselyAdapter(db),
	emailAndPassword: { enabled: false },
	// Email OTP: kode 6 digit, berlaku 5 menit
	plugins: [
		emailOTP({
			otpLength: 6,
			expiresIn: 300,
			async sendVerificationOTP({ email, otp }) {
				// Hanya kirim OTP ke email yang diizinkan admin (whitelist)
				if (!isAdminEmail(email)) {
					console.warn(`[better-auth] OTP diminta untuk email non-admin: ${email} — tidak dikirim.`);
					return;
				}
				if (!smtpSiap()) {
					console.error('[better-auth] SMTP Gmail belum dikonfigurasi — OTP TIDAK terkirim!');
					return;
				}
				await sendOtpEmail(email, otp);
			}
		})
	],
	// Sesi: 1 jam idle → kedaluwarsa; updateAge = diperpanjang otomatis saat
	// admin masih aktif (sliding session). "Hilang saat browser ditutup"
	// ditangani di sisi client (cookie indikator session di +page.svelte).
	session: {
		expiresIn: 60 * 60, // 1 jam
		updateAge: 60 * 5 // refresh sesi jika tersisa < 5 menit (sliding)
	},
	advanced: {
		cookiePrefix: 'bpm_admin',
		defaultCookieAttributes: {
			secure: env.NODE_ENV === 'production' || env.BETTER_AUTH_URL?.startsWith('https'),
			sameSite: 'lax',
			httpOnly: true
		}
	},
	trustedOrigins: ['http://localhost:3000', 'https://bpmfia5.vercel.app']
});
