<script lang="ts">
	// MovingBorder — garis emas tipis yang "berjalan" mengelilingi border luar
	// konten. Animasi stroke-dashoffset CSS, TAPI period dash = panjang path
	// penuh (dihitung via JS) sehingga loop restart tidak terlihat — garis
	// mengalir kontinu tanpa putus di titik mana pun.
	import { onMount } from 'svelte';

	let {
		children,
		borderRadius = '24px',
		rx = '24',
		ry = '24',
		duration = '3s',
		segment = 110,
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		borderRadius?: string;
		rx?: string;
		ry?: string;
		duration?: string;
		segment?: number;
		class?: string;
	} = $props();

	let pathRef = $state<SVGRectElement | null>(null);
	let wrapRef = $state<HTMLDivElement | null>(null);

	const updatePath = () => {
		const p = pathRef;
		if (!p) return;
		try {
			const L = p.getTotalLength();
			if (L > 0) {
				// Period dash = panjang path penuh: segmen + gap sisanya.
				// Offset 0 → -L kembali ke posisi identik → loop tak terlihat.
				p.style.strokeDasharray = `${segment} ${Math.max(10, L - segment)}`;
				p.style.setProperty('--mb-len', `${L}px`);
			}
		} catch {
			/* abaikan (SVG geometry tidak tersedia) */
		}
	};

	onMount(() => {
		updatePath();
		if (typeof ResizeObserver !== 'undefined' && wrapRef) {
			const ro = new ResizeObserver(updatePath);
			ro.observe(wrapRef);
			return () => ro.disconnect();
		}
		window.addEventListener('resize', updatePath);
		return () => window.removeEventListener('resize', updatePath);
	});
</script>

<div class="mb-wrap {className}" style="border-radius: {borderRadius}" bind:this={wrapRef}>
	<svg
		class="mb-svg"
		width="100%"
		height="100%"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<defs>
			<linearGradient id="mb-gold" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#ffe08a" />
				<stop offset="45%" stop-color="#ffd155" />
				<stop offset="100%" stop-color="#f0a500" />
			</linearGradient>
		</defs>
		<!-- Segmen garis emas berjalan; dasharray & --mb-len di-set JS agar
		     period dash = keliling path (loop mulus). -->
		<rect
			class="mb-path"
			bind:this={pathRef}
			fill="none"
			stroke="url(#mb-gold)"
			stroke-width="4"
			stroke-linecap="round"
			stroke-dasharray="110 600"
			rx={rx}
			ry={ry}
			width="100%"
			height="100%"
			style="animation-duration: {duration}"
		/>
	</svg>
	<div class="mb-content" style="border-radius: calc({borderRadius} * 0.96)">
		{@render children()}
	</div>
</div>

<style>
	.mb-wrap {
		position: relative;
		/* Padding = ketebalan garis: stroke 4px pas berada di area padding,
		   sehingga garis tampil di border LUAR konten (tidak menutupi isi). */
		padding: 4px;
		overflow: hidden;
	}
	.mb-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;
	}
	.mb-path {
		animation-name: mbDash;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes mbDash {
		to {
			/* -L (panjang path penuh, dari --mb-len) = satu putaran penuh;
			   pattern pada -L identik dengan 0 → loop kontinu tanpa lompatan */
			stroke-dashoffset: calc(-1 * var(--mb-len, 710px));
		}
	}
	.mb-content {
		position: relative;
		height: 100%;
		z-index: 1;
	}

	/* Hormati preferensi animasi minim: garis emas penuh statis (tetap cantik) */
	@media (prefers-reduced-motion: reduce) {
		.mb-path {
			animation: none;
			stroke-dasharray: none;
		}
	}
</style>
