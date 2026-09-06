<script lang="ts">
	// PdfThumbnail — pratinjau halaman PERTAMA PDF sebagai thumbnail (rasio asli,
	// biasanya A4). Urutan: thumb R2 (belasan KB, tercepat) → render di perangkat
	// (fallback, tajam 900px) → ikon "PDF" (gagal total). Klik thumbnail → tetap
	// buka PDF viewer (handler di pemakai). Render memakai lib/thumb.ts bersama.
	import { onMount } from 'svelte';
	import {
		proxyUrl,
		renderPdfCanvas,
		backfillThumbFromCanvas
	} from '$lib/thumb';

	let {
		url,
		thumb = null,
		backfill = false,
		class: className = ''
	}: { url: string; thumb?: string | null; backfill?: boolean; class?: string } = $props();

	let imgUrl = $state<string | null>(null);
	let failed = $state(false);
	let thumbFailed = $state(false);

	onMount(async () => {
		// Thumb R2 dicoba dulu via <img> (di template). Bila tidak ada thumb
		// yang diketahui, langsung render di perangkat.
		if (!thumb) await render();
	});

	async function render() {
		try {
			// 900px untuk TAMPILAN (downscale → tajam, perilaku lama dipertahankan)
			const canvas = await renderPdfCanvas(url, 900);
			if (!canvas) throw new Error('render gagal');
			let fmt = 'image/jpeg';
			try {
				if (canvas.toDataURL('image/webp', 1).startsWith('data:image/webp')) fmt = 'image/webp';
			} catch {
				fmt = 'image/jpeg';
			}
			imgUrl = canvas.toDataURL(fmt, 0.85);
			// Backfill diam-diam: simpan thumb 600px ke R2 agar pengunjung
			// berikutnya langsung dapat file kecil (hanya saat admin melihat).
			if (backfill && thumb) void backfillThumbFromCanvas(url, canvas);
		} catch {
			failed = true;
		}
	}

	function onThumbError() {
		thumbFailed = true;
		void render();
	}
</script>

{#if thumb && !thumbFailed}
	<img src={proxyUrl(thumb)} alt="Pratinjau PDF" class={className} loading="lazy" onerror={onThumbError} />
{:else if imgUrl}
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
