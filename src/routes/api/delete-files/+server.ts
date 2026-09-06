// Hapus file di R2 (asli + thumb) — hanya untuk admin yang login.
// Dipakai saat hapus peraturan/berita/acara & saat file diganti/dihapus dari form edit.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getAdminSession } from '$lib/server/adminGuard';

/** Basename + varian thumb-nya (tanpa duplikat). */
function keysFor(url: string): string[] {
	try {
		const u = new URL(url);
		const pub = new URL(env.R2_PUBLIC_URL || 'http://x');
		if (u.hostname !== pub.hostname) return [];
		const name = (u.pathname.split('/').pop() || '').replace(/\s+/g, '_');
		if (!name) return [];
		if (name.endsWith('-thumb.webp')) return [name];
		const dot = name.lastIndexOf('.');
		const thumb = (dot > 0 ? name.slice(0, dot) : name) + '-thumb.webp';
		return [name, thumb];
	} catch {
		return [];
	}
}

export async function POST({ request }) {
	await getAdminSession(request);
	const body = await request.json().catch(() => ({}));
	const urls: string[] = Array.isArray(body.urls) ? body.urls.map(String) : [];
	const keys: string[] = [...new Set(urls.flatMap(keysFor))].slice(0, 100);
	if (keys.length === 0) return json({ ok: true, deleted: 0 });

	const r2 = new S3Client({
		region: 'auto',
		endpoint: env.R2_ENDPOINT,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID!,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY!
		}
	});

	try {
		const res = await r2.send(
			new DeleteObjectsCommand({
				Bucket: env.R2_BUCKET_NAME,
				Delete: { Objects: keys.map((Key) => ({ Key })) }
			})
		);
		return json({ ok: true, deleted: res.Deleted?.length ?? 0 });
	} catch (err: unknown) {
		return json({ error: err instanceof Error ? err.message : 'Gagal hapus file' }, { status: 500 });
	}
}
