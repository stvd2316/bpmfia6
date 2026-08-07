import { json } from '@sveltejs/kit';

// Pengganti: src/app/api/download/route.ts (Next.js) → SvelteKit +server.ts
export async function GET({ url }) {
	const target = url.searchParams.get('url');
	const filename = url.searchParams.get('filename') || 'document.pdf';

	if (!target) return json({ error: 'URL diperlukan' }, { status: 400 });

	try {
		const response = await fetch(target);
		if (!response.ok) throw new Error('Gagal mengambil file dari R2');

		const blob = await response.blob();

		const headers = new Headers();
		headers.set('Content-Type', 'application/pdf');
		headers.set('Content-Disposition', `attachment; filename="${filename}"`);
		// TAMBAHAN INI: Cache PDF agar tidak unduh ulang
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');

		return new Response(blob, { headers });
	} catch (error) {
		return json({ error: 'Gagal mengunduh file' }, { status: 500 });
	}
}
