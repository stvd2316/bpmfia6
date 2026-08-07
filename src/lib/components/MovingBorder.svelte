<script lang="ts">
	// MovingBorder — garis emas tipis yang "berjalan" mengelilingi border luar
	// konten (versi Svelte murni dari komponen React framer-motion
	// "moving-border"). Tanpa JS runtime: animasi murni CSS
	// (stroke-dashoffset pada SVG rect) — sangat ringan di HP.
	let {
		children,
		borderRadius = '24px',
		rx = '24',
		ry = '24',
		duration = '6s',
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		borderRadius?: string;
		rx?: string;
		ry?: string;
		duration?: string;
		class?: string;
	} = $props();
</script>

<div class="mb-wrap {className}" style="border-radius: {borderRadius}">
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
		<!-- Segmen garis emas yang berjalan: dasharray = panjang segmen + gap,
		     dashoffset dianimasikan CSS sehingga segmen mengitari border. -->
		<rect
			class="mb-path"
			fill="none"
			stroke="url(#mb-gold)"
			stroke-width="3"
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
		/* Padding = ketebalan garis: stroke 3px pas berada di area padding,
		   sehingga garis tampil di border LUAR konten (tidak menutupi isi). */
		padding: 3px;
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
			/* Periode dash (110 + 600) = 710 → offset -710 = satu putaran penuh */
			stroke-dashoffset: -710;
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
