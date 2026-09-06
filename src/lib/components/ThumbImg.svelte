<script lang="ts">
	// ThumbImg — <img> untuk file webp yang mengutamakan thumb R2 (kecil, cepat)
	// dengan fallback otomatis ke file asli bila thumb belum ada. Saat admin
	// melihat file yang belum punya thumb, thumb di-backfill diam-diam ke R2.
	import { proxyUrl, thumbUrlFor, backfillImageThumb } from '$lib/thumb';

	let {
		url,
		alt = '',
		class: className = '',
		backfill = false
	}: { url: string; alt?: string; class?: string; backfill?: boolean } = $props();

	const thumb = thumbUrlFor(url);
	let failed = $state(false);

	function onErr(e: Event) {
		if (failed) return;
		failed = true;
		(e.currentTarget as HTMLImageElement).src = proxyUrl(url);
		if (backfill && thumb) void backfillImageThumb(url);
	}
</script>

<img src={proxyUrl(thumb ?? url)} {alt} class={className} loading="lazy" onerror={onErr} />
