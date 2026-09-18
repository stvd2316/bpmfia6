// Sitemap dinamis — diakses di https://www.bpmfiaui.com/sitemap.xml
// Dipakai untuk pendaftaran Google Search Console.
//
// CATATAN ARSITEKTUR: website ini SPA (ssr=false) dengan navigasi hash
// (#peraturan/{id}, #berita/{id}). Google MENGABAIKAN fragment URL, sehingga
// hanya halaman "/" yang bisa terindex sebagai 1 dokumen. Entri dinamis di
// bawah DITULIS SEBAGAI CONTOH BERKOMENTAR — aktifkan hanya setelah halaman
// detail punya rute nyata (mis. /peraturan/[id]) alih-alih hash.
import type { RequestHandler } from './$types';

const SITE = 'https://www.bpmfiaui.com';

export const GET: RequestHandler = async () => {
	const today = new Date().toISOString().split('T')[0];

	const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
		// Halaman utama (satu-satunya URL kanonis yang bisa terindex saat ini)
		{ loc: `${SITE}/`, lastmod: today, changefreq: 'daily', priority: '1.0' }

		// CONTOH DINAMIS (aktifkan bila rute nyata tersedia):
		// const { createClient } = await import('@supabase/supabase-js');
		// const supabase = createClient(
		//   'https://fogkgkqnxpzedmtclhil.supabase.co',
		//   'sb_publishable_0iQBBuVFUdVLHgMSe6Y_0g_F_rGHFcv'
		// );
		// const { data: peraturan } = await supabase.from('peraturan').select('id, tgl_penetapan');
		// for (const p of peraturan ?? []) {
		//   urls.push({
		//     loc: `${SITE}/peraturan/${p.id}`,
		//     lastmod: (p.tgl_penetapan as string) || today,
		//     changefreq: 'monthly',
		//     priority: '0.8'
		//   });
		// }
		// const { data: berita } = await supabase.from('berita').select('id, tgl_terbit');
		// for (const b of berita ?? []) {
		//   urls.push({
		//     loc: `${SITE}/berita/${b.id}`,
		//     lastmod: (b.tgl_terbit as string) || today,
		//     changefreq: 'monthly',
		//     priority: '0.8'
		//   });
		// }
	];

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urls
			.map(
				(u) =>
					`  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			// Sitemap jarang berubah dalam sehari — cache ringan 1 jam
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
