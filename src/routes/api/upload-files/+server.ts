import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Pengganti: uploadFilesAction pada src/app/actions.ts (Next.js server action)
// → endpoint SvelteKit +server.ts (dipanggil client via fetch, respons identik)
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		if (files.length === 0) return json({ urls: [] });
		if (files.length > 10) return json({ error: 'Maksimal 10 file' });

		const r2 = new S3Client({
			region: 'auto',
			endpoint: env.R2_ENDPOINT,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID!,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY!
			}
		});

		const urls: string[] = [];

		for (const file of files) {
			if (file.type !== 'application/pdf' && file.type !== 'image/webp') {
				return json({ error: `File ${file.name} bukan format WebP atau PDF` });
			}
			if (file.size > 2000000) {
				// 2MB
				return json({ error: `Ukuran file ${file.name} melebihi 2MB` });
			}

			const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
			const arrayBuffer = await file.arrayBuffer();

			await r2.send(
				new PutObjectCommand({
					Bucket: env.R2_BUCKET_NAME,
					Key: fileName,
					Body: new Uint8Array(arrayBuffer),
					ContentType: file.type
				})
			);

			urls.push(`${env.R2_PUBLIC_URL}/${fileName}`);
		}

		return json({ urls });
	} catch (err: any) {
		return json({ error: err.message });
	}
}
