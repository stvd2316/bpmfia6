// Helper sesi admin — dipakai oleh endpoint yang butuh login admin.
import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { isAdminEmailDb } from '$lib/server/adminStore';

export async function getAdminSession(request: Request) {
	const headers = new Headers(request.headers);
	const session = await auth.api.getSession({ headers });
	if (!session || !session.user?.email || !(await isAdminEmailDb(session.user.email))) {
		throw error(401, 'Tidak diizinkan — login admin diperlukan.');
	}
	return session;
}
