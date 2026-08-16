<script lang="ts">
	// Diagnosa iOS: tes fitur + render thumbnail PDF langkah demi langkah.
	// Hasil ditampilkan sebagai daftar teks — screenshot dan kirimkan ke dev.
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	let lines = $state<string[]>([]);
	let pdfUrl = $state<string>('');
	let thumbImg = $state<string | null>(null);

	const log = (s: string) => {
		lines = [...lines, s];
	};

	onMount(async () => {
		log('UA: ' + navigator.userAgent);
		log('platform: ' + navigator.platform);
		log('---');
		log('1. Promise.withResolvers: ' + typeof (Promise as any).withResolvers);
		log('2. Worker: ' + typeof Worker);
		log('3. structuredClone: ' + typeof structuredClone);
		log('4. crypto.randomUUID: ' + typeof crypto.randomUUID);
		log('5. ReadableStream: ' + typeof ReadableStream);
		log('6. AbortController: ' + typeof AbortController);
		log('---');
		// Tes module worker
		try {
			const blob = new Blob(['self.onmessage = () => {};'], { type: 'text/javascript' });
			const w = new Worker(URL.createObjectURL(blob), { type: 'module' });
			log('7. module worker: OK');
			w.terminate();
		} catch (e) {
			log('7. module worker: GAGAL — ' + (e as Error).message);
		}
		// Tes classic worker
		try {
			const blob = new Blob(['self.onmessage = () => {};'], { type: 'text/javascript' });
			const w = new Worker(URL.createObjectURL(blob));
			log('8. classic worker: OK');
			w.terminate();
		} catch (e) {
			log('8. classic worker: GAGAL — ' + (e as Error).message);
		}
		// Ambil PDF pertama dari data
		try {
			const { data } = await supabase.from('peraturan').select('pdf_url').not('pdf_url', 'is', null).limit(1);
			if (data && data.length > 0 && data[0].pdf_url) {
				pdfUrl = data[0].pdf_url;
				log('9. pdf_url ditemukan: ' + pdfUrl.slice(0, 50) + '...');
			} else {
				log('9. TIDAK ADA pdf_url di data!');
			}
		} catch (e) {
			log('9. supabase error: ' + (e as Error).message);
		}
		log('---');
		// Tes fetch PDF via proxy
		if (pdfUrl) {
			try {
				const r = await fetch('/api/download?url=' + encodeURIComponent(pdfUrl));
				log('10. fetch PDF via proxy: status ' + r.status + ' | type: ' + (r.headers.get('content-type') || '?'));
			} catch (e) {
				log('10. fetch PDF via proxy: GAGAL — ' + (e as Error).message);
			}
		}
		// Tes render pdfjs dengan fake worker (persis jalur iOS di PdfThumbnail)
		if (pdfUrl) {
			try {
				const mod = await import('pdfjs-dist');
				log('11. pdfjs import: OK (v' + (mod as any).version + ')');
				const savedWorker = (window as any).Worker;
				(window as any).Worker = undefined;
				try {
					const task = mod.getDocument({ url: '/api/download?url=' + encodeURIComponent(pdfUrl) });
					const doc = await task.promise;
					log('12. dokumen PDF terbuka: ' + doc.numPages + ' halaman');
					const page = await doc.getPage(1);
					const vp = page.getViewport({ scale: 1 });
					const scale = 900 / vp.width;
					const vp2 = page.getViewport({ scale });
					const canvas = document.createElement('canvas');
					canvas.width = Math.floor(vp2.width);
					canvas.height = Math.floor(vp2.height);
					const ctx = canvas.getContext('2d');
					if (!ctx) throw new Error('canvas 2d null');
					await page.render({ canvasContext: ctx, viewport: vp2 }).promise;
					log('13. render halaman 1: OK (' + canvas.width + 'x' + canvas.height + ')');
					let fmt = 'image/jpeg';
					try {
						if (canvas.toDataURL('image/webp', 1).startsWith('data:image/webp')) fmt = 'image/webp';
					} catch {
						fmt = 'image/jpeg';
					}
					thumbImg = canvas.toDataURL(fmt, 0.85);
					log('14. toDataURL: OK (' + fmt + ')');
					await task.destroy();
				} finally {
					(window as any).Worker = savedWorker;
				}
			} catch (e) {
				log('15. RENDER GAGAL — ' + (e as Error).message);
				log('    stack: ' + ((e as Error).stack || '').slice(0, 300));
			}
		}
		log('--- SELESAI ---');
	});
</script>

<div style="max-width: 640px; margin: 40px auto; padding: 24px; font-family: ui-monospace, monospace; font-size: 13px; background: #0a0a0c; color: #ffd155; border-radius: 12px; white-space: pre-wrap; word-break: break-all;">
	<h2 style="color: #fff; font-size: 16px; margin: 0 0 12px;">DIAGNOSA iOS — bpmfia5</h2>
	{#each lines as l}<div>{l}</div>{/each}
	{#if thumbImg}<div style="margin-top: 16px; color: #7ee787;">THUMBNAIL BERHASIL ↓</div><img src={thumbImg} alt="thumb" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" />{/if}
</div>
