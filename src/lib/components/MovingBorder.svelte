<script lang="ts">
	// MovingBorder — border emas "berjalan" mengelilingi konten (port Svelte murni
	// dari komponen React framer-motion "moving-border", tanpa dependency baru).
	// Sebuah "bola cahaya" emas bergerak mengikuti path SVG border secara kontinu
	// via requestAnimationFrame + getPointAtLength (ringan: hanya transform 2D).
	import { onMount } from 'svelte';

	let {
		children,
		borderRadius = '24px',
		rx = '24',
		ry = '24',
		duration = 6000,
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		borderRadius?: string;
		rx?: string;
		ry?: string;
		duration?: number;
		class?: string;
	} = $props();

	let pathRef = $state<SVGRectElement | null>(null);
	let ballX = $state(0);
	let ballY = $state(0);

	onMount(() => {
		// Hormati preferensi animasi minim: tampilkan border statis saja
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const start = performance.now();
		let raf = 0;
		const tick = (time: number) => {
			const path = pathRef;
			if (path) {
				const length = path.getTotalLength();
				if (length) {
					const pxPerMs = length / duration;
					const progress = ((time - start) * pxPerMs) % length;
					const pt = path.getPointAtLength(progress);
					ballX = pt.x;
					ballY = pt.y;
				}
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="mb-wrap {className}" style="border-radius: {borderRadius}">
	<div class="mb-inner" style="border-radius: calc({borderRadius} * 0.96)">
		<svg class="mb-svg" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
			<rect fill="none" width="100%" height="100%" rx={rx} ry={ry} bind:this={pathRef} />
		</svg>
		<div
			class="mb-ball"
			style="transform: translate({ballX}px, {ballY}px) translate(-50%, -50%);"
		></div>
	</div>
	<div class="mb-content" style="border-radius: calc({borderRadius} * 0.96)">
		{@render children()}
	</div>
</div>

<style>
	.mb-wrap {
		position: relative;
		padding: 1.5px;
		overflow: hidden;
	}
	.mb-inner {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.mb-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	/* Bola cahaya emas — radial gradient transparan sehingga hanya "menyala"
	   saat melewati tepi konten; blend mode screen membuatnya menyatu dengan
	   latar apa pun. */
	.mb-ball {
		position: absolute;
		top: 0;
		left: 0;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(255, 224, 138, 0.95) 0%,
			rgba(255, 209, 85, 0.45) 30%,
			rgba(240, 165, 0, 0.12) 55%,
			transparent 70%
		);
		mix-blend-mode: screen;
		pointer-events: none;
		will-change: transform;
	}
	.mb-content {
		position: relative;
		height: 100%;
	}
</style>
