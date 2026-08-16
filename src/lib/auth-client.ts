// Client Better Auth untuk SPA (browser-only; project ssr=false).
import { createAuthClient } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const authClient = createAuthClient({
	baseURL,
	plugins: [emailOTPClient()]
});

// Email OTP via fetch langsung ke path endpoint yang BENAR (client inference
// plugin 1.6 mengarahkan ke path salah — terbukti 404 di tes). Path diambil
// dari source server: /email-otp/send-verification-otp & /sign-in/email-otp.
type OtpResult = { error?: { message?: string } };

/** Kirim kode OTP ke email */
export async function sendAdminOtp(email: string): Promise<OtpResult> {
	const res = await fetch(`${baseURL}/api/auth/email-otp/send-verification-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, type: 'sign-in' })
	});
	if (res.ok) return {};
	const data = await res.json().catch(() => null);
	return { error: { message: data?.message || 'Gagal mengirim kode OTP.' } };
}

/** Verifikasi OTP & login */
export async function verifyAdminOtp(email: string, otp: string): Promise<OtpResult> {
	const res = await fetch(`${baseURL}/api/auth/sign-in/email-otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, otp })
	});
	const data = await res.json().catch(() => null);
	if (res.ok) return {};
	return { error: { message: data?.message || 'Kode OTP salah atau sudah kedaluwarsa.' } };
}
