<script lang="ts">
	// GalleryCarousel — port Svelte murni dari komponen React "gallery4"
	// (shadcn + embla carousel), tanpa dependency apa pun:
	// CSS scroll-snap menangani swipe/geser alami (mobile & desktop),
	// tombol panah & dot indicator digerakkan via scrollTo + scroll event.
	import { onMount } from 'svelte';

	export interface GalleryItem {
		id: string;
		title: string;
		description?: string;
		image: string;
	}

	let {
		items,
		title = '',
		description = '',
		class: className = ''
	}: { items: GalleryItem[]; title?: string; description?: string; class?: string } = $props();

	let trackRef = $state<HTMLDivElement | null>(null);
	let current = $state(0);
	let canPrev = $state(false);
	let canNext = $state(true);

	// Lebar satu langkah (kartu + gap) — dihitung dari posisi kartu nyata,
	// jadi akurat di semua ukuran layar & perubahan resize.
	const step = (): number => {
		const t = trackRef;
		if (!t) return 0;
		const cards = t.querySelectorAll(':scope > .gal-card');
		if (!cards.length) return 0;
		const first = cards[0] as HTMLElement;
		if (cards.length > 1) {
			const second = cards[1] as HTMLElement;
			return second.offsetLeft - first.offsetLeft;
		}
		return first.offsetWidth;
	};

	const sync = () => {
		const t = trackRef;
		if (!t) return;
		const s = step();
		if (!s) return;
		const cards = t.querySelectorAll('.gal-card');
		const last = cards.length - 1;
		const maxScroll = t.scrollWidth - t.clientWidth;
		let idx = Math.round(t.scrollLeft / s);
		// Saat scroll benar-benar mentok di ujung (toleransi 4px — scroll-snap
		// selalu berhenti presisi di maxScroll), slide terakhir dianggap aktif.
		// (di layar sempit max scroll < 2×step sehingga kartu terakhir tidak
		// bisa snap penuh — tetap harus bisa diaktifkan)
		if (maxScroll > 0 && t.scrollLeft >= maxScroll - 4) idx = last;
		current = Math.max(0, Math.min(last, idx));
		canPrev = current > 0;
		canNext = current < last;
	};

	const goTo = (i: number) => {
		const t = trackRef;
		if (!t) return;
		const cards = t.querySelectorAll('.gal-card');
		const last = cards.length - 1;
		const target = Math.max(0, Math.min(last, i));
		const maxScroll = t.scrollWidth - t.clientWidth;
		// Slide terakhir → scroll sampai ujung (bukan i×step, karena max
		// scroll bisa lebih pendek dari 2×step di layar sempit)
		const left = target === last ? maxScroll : target * step();
		t.scrollTo({ left, behavior: 'smooth' });
	};

	onMount(() => {
		const t = trackRef;
		if (!t) return;
		t.addEventListener('scroll', sync, { passive: true });
		sync();
		let ro: ResizeObserver | null = null;
		if (typeof ResizeObserver !== 'undefined') {
			ro = new ResizeObserver(sync);
			ro.observe(t);
		}
		return () => {
			t.removeEventListener('scroll', sync);
			ro?.disconnect();
		};
	});
</script>

<div class="gal {className}">
	<!-- Baris atas: judul (opsional) + tombol panah -->
	{#if title}
		<div class="gal-top">
			<div>
				{#if title}<h3 class="gal-heading">{title}</h3>{/if}
				{#if description}<p class="gal-sub">{description}</p>{/if}
			</div>
			<div class="gal-arrows">
				<button type="button" class="gal-arrow" onclick={() => goTo(current - 1)} disabled={!canPrev} aria-label="Slide sebelumnya">&lt;</button>
				<button type="button" class="gal-arrow" onclick={() => goTo(current + 1)} disabled={!canNext} aria-label="Slide berikutnya">&gt;</button>
			</div>
		</div>
	{/if}

	<!-- Track carousel: scroll-snap horizontal -->
	<div class="gal-track" bind:this={trackRef} role="region" aria-roledescription="carousel" aria-label="Galeri divisi">
		{#each items as item (item.id)}
			<div class="gal-card" role="group" aria-roledescription="slide" aria-label={item.title}>
				<img src={item.image} alt={item.title} draggable={false} />
				<div class="gal-overlay"></div>
				<div class="gal-body">
					<span class="gal-tag">Divisi</span>
					<div class="gal-title">{item.title}</div>
					{#if item.description}<div class="gal-desc">{item.description}</div>{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Dot indicators -->
	<div class="gal-dots">
		{#each items as _, i (i)}
			<button
				type="button"
				class="gal-dot {current === i ? 'active' : ''}"
				onclick={() => goTo(i)}
				aria-label="Ke slide {i + 1}"
			></button>
		{/each}
	</div>
</div>

<style>
	.gal {
		width: 100%;
		max-width: 100%;
	}
	.gal-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 16px;
		margin-bottom: 20px;
		text-align: left;
	}
	.gal-heading {
		font-family: var(--font-heading);
		font-size: 22px;
		font-weight: 700;
		color: var(--obsidian-900);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.gal-sub {
		font-family: var(--font-body);
		color: var(--mute);
		font-size: 14px;
		margin-top: 4px;
		max-width: 480px;
	}
	.gal-arrows {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.gal-arrow {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--hairline);
		background: var(--surface-soft);
		color: var(--obsidian-900);
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	.gal-arrow:hover:not(:disabled) {
		background: var(--gold-grad);
		border-color: var(--gold-3);
		color: var(--ink);
		box-shadow: 0 4px 14px rgba(255, 209, 85, 0.3);
	}
	.gal-arrow:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.gal-track {
		display: flex;
		gap: 20px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
		padding-bottom: 8px;
		scrollbar-width: none;
	}
	.gal-track::-webkit-scrollbar {
		display: none;
	}
	.gal-card {
		flex: 0 0 auto;
		width: min(85vw, 340px);
		aspect-ratio: 3 / 4;
		position: relative;
		border-radius: var(--radius-lg);
		overflow: hidden;
		scroll-snap-align: start;
		box-shadow: var(--card-shadow);
		border: 1px solid rgba(255, 209, 85, 0.25);
	}
	.gal-card img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transition: transform 0.3s ease;
		pointer-events: none;
	}
	.gal-card:hover img {
		transform: scale(1.05);
	}
	.gal-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(5, 5, 8, 0) 35%, rgba(5, 5, 8, 0.55) 62%, rgba(5, 5, 8, 0.92) 100%);
	}
	.gal-body {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		padding: 20px;
		text-align: left;
	}
	.gal-tag {
		display: inline-block;
		background: var(--gold-grad);
		color: var(--ink);
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 3px 10px;
		border-radius: 6px;
		margin-bottom: 8px;
	}
	.gal-title {
		font-family: var(--font-heading);
		font-size: 20px;
		font-weight: 700;
		color: var(--on-dark);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		line-height: 1.3;
	}
	.gal-desc {
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--on-dark-mute);
		margin-top: 6px;
		line-height: 1.5;
	}
	.gal-dots {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin-top: 18px;
	}
	.gal-dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		border: none;
		padding: 0;
		background: rgba(10, 10, 12, 0.18);
		cursor: pointer;
		transition: all 0.25s;
	}
	.gal-dot:hover {
		background: rgba(255, 209, 85, 0.7);
	}
	.gal-dot.active {
		background: var(--gold-2);
		box-shadow: 0 0 8px rgba(255, 209, 85, 0.6);
		width: 22px;
	}
</style>
