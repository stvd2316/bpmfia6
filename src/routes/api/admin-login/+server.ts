import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Pengganti: src/app/api/admin-login/route.ts (Next.js) → SvelteKit +server.ts
export async function POST({ request }) {
	try {
		const { username, password } = await request.json();

		// Cek kredensial (bisa pakai env atau hardcoded)
		if (username === env.ADMIN_USER && password === env.ADMIN_PASS) {
			return json({ success: true });
		}

		// Fallback hardcoded jika env belum kebaca
		if (username === 'stvd23' && password === '12345') {
			return json({ success: true });
		}

		return json({ success: false, message: 'Username atau password salah!' }, { status: 401 });
	} catch (error) {
		return json({ success: false, message: 'Format request salah' }, { status: 400 });
	}
}
