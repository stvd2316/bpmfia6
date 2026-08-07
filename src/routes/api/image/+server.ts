import { json } from '@sveltejs/kit';

// Pengganti: src/app/api/image/route.ts (Next.js) → SvelteKit +server.ts
export async function GET({ url }) {
	const target = url.searchParams.get('url');

	if (!target) {
		return json({ error: 'URL diperlukan' }, { status: 400 });
	}

	try {
		const response = await fetch(target);

		if (!response.ok) {
			throw new Error('Gagal mengambil file');
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		const blob = await response.blob();

		const headers = new Headers();
		headers.set('Content-Type', contentType);

		// TAMBAHAN INI: Suruh browser HP menghafal gambar selama 1 tahun (31536000 detik)
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');

		return new Response(blob, { headers });
	} catch (error) {
		return json({ error: 'Gagal memuat file' }, { status: 500 });
	}
}
