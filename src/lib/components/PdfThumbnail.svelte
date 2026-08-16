<script lang="ts">
	// PdfThumbnail — pratinjau halaman PERTAMA PDF sebagai thumbnail (rasio asli,
	// biasanya A4). Render via pdf.js (lazy import: hanya dimuat saat ada PDF di
	// halaman). Klik thumbnail → tetap buka PDF viewer (handler di pemakai).
	// Fallback: ikon "PDF" jika gagal dimuat.
	import { onMount } from 'svelte';

	let { url, class: className = '' }: { url: string; class?: string } = $props();

	let imgUrl = $state<string | null>(null);
	let failed = $state(false);

	onMount(async () => {
		try {
			const mod = await import('pdfjs-dist');
			// iOS Safari (terutama 15.x): `new Worker(url, {type:'module'})` yang
			// dipakai pdfjs sering GAGAL di iPhone (thumbnail tidak muncul).
			// Solusi: sembunyikan Worker sementara → pdfjs otomatis memakai
			// 'fake worker' (render di main thread). Worker dikembalikan setelah
			// selesai agar EmbedPDF viewer tetap bisa memakai worker.
			const isIOS =
				/iPad|iPhone|iPod/.test(navigator.userAgent) ||
				(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
			if (isIOS) {
				const savedWorker = (window as any).Worker;
				(window as any).Worker = undefined;
				try {
					await renderThumb(url, mod);
				} finally {
					(window as any).Worker = savedWorker;
				}
			} else {
				const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
				mod.GlobalWorkerOptions.workerSrc = worker.default;
				await renderThumb(url, mod);
			}
		} catch {
			failed = true;
		}
	});

	async function renderThumb(u: string, pdfjs: typeof import('pdfjs-dist')) {
		if (!pdfjs) return;
		const task = pdfjs.getDocument({ url: u });
		const doc = await task.promise;
		const page = await doc.getPage(1);
		// Render 900px CSS — ditampilkan hingga full-width konten (~800px) dengan
		// downscale → TAJAM (sebelumnya 300px di-upscale → buram)
		const targetW = 900;
		const vp1 = page.getViewport({ scale: 1 });
		const scale = targetW / vp1.width;
		const vp = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		canvas.width = Math.floor(vp.width);
		canvas.height = Math.floor(vp.height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('canvas 2d tidak tersedia');
		// pdfjs v4: render menerima canvasContext
		await page.render({ canvasContext: ctx, viewport: vp }).promise;
		// PENTING iOS: Safari TIDAK mendukung encoding WebP di canvas
		// (toDataURL('image/webp') bisa gagal/error di iPhone) → deteksi dukungan
		// sekali, fallback ke JPEG (didukung semua browser, ukuran juga ringan)
		let fmt = 'image/jpeg';
		try {
			if (canvas.toDataURL('image/webp', 1).startsWith('data:image/webp')) fmt = 'image/webp';
		} catch {
			fmt = 'image/jpeg';
		}
		imgUrl = canvas.toDataURL(fmt, 0.85);
		await task.destroy();
	}
</script>

{#if imgUrl}
	<img src={imgUrl} alt="Pratinjau PDF" class={className} loading="lazy" />
{:else if failed}
	<div class="pdf-icon">PDF</div>
{:else}
	<div class="pdf-thumb-loading">…</div>
{/if}

<style>
	.pdf-thumb-loading {
		width: 100%;
		aspect-ratio: 1 / 1.414;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f8f8f8, #e4e4e4);
		color: #999;
		font-family: var(--font-heading);
		font-size: 14px;
	}
</style>
