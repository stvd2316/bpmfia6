import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Pengganti: uploadPdfAction pada src/app/actions.ts (Next.js server action)
// → endpoint SvelteKit +server.ts (dipanggil client via fetch, respons identik)
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		if (!file) return json({ error: 'File tidak ditemukan' });

		if (file.type !== 'application/pdf') return json({ error: 'Format harus PDF' });
		if (file.size > 500000) return json({ error: 'Ukuran PDF maksimal 500KB' });

		const r2 = new S3Client({
			region: 'auto',
			endpoint: env.R2_ENDPOINT,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID!,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY!
			}
		});

		const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
		const arrayBuffer = await file.arrayBuffer();

		await r2.send(
			new PutObjectCommand({
				Bucket: env.R2_BUCKET_NAME,
				Key: fileName,
				Body: new Uint8Array(arrayBuffer),
				ContentType: 'application/pdf'
			})
		);

		return json({ url: `${env.R2_PUBLIC_URL}/${fileName}` });
	} catch (err: any) {
		return json({ error: err.message });
	}
}
