<script lang="ts">
	import { onMount } from 'svelte';

	// Port 1:1 dari komponen ImageSwiper di page.tsx (React → Svelte 5 runes)
	let { images }: { images: string[] } = $props();

	let cardStackRef: HTMLDivElement | null = null;
	let isSwiping = false;
	let startX = 0;
	let startY = 0;
	let currentX = 0;
	let animationFrameId: number | null = null;
	let isHorizontalSwipe: boolean | null = null;

	let cardOrder = $state<number[]>(Array.from({ length: images.length }, (_, i) => i));
	let dimensions = $state({ width: 450, height: 600 });

	onMount(() => {
		const hR = () => {
			if (window.innerWidth < 600) dimensions = { width: 320, height: 427 };
			else dimensions = { width: 450, height: 600 };
		};
		hR();
		window.addEventListener('resize', hR);
		return () => window.removeEventListener('resize', hR);
	});

	let cW = $derived(dimensions.width);
	let cH = $derived(dimensions.height);

	const getCards = (): HTMLElement[] => {
		if (!cardStackRef) return [];
		return Array.from(cardStackRef.querySelectorAll('.image-card')) as HTMLElement[];
	};

	const getActiveCard = (): HTMLElement | null => {
		return getCards()[0] || null;
	};

	const updatePositions = () => {
		getCards().forEach((c, i) => {
			c.style.setProperty('--i', (i + 1).toString());
			c.style.setProperty('--swipe-x', '0px');
			c.style.setProperty('--swipe-rotate', '0deg');
			c.style.opacity = '1';
		});
	};

	const applySwipeStyles = (dX: number) => {
		const c = getActiveCard();
		if (!c) return;
		c.style.setProperty('--swipe-x', `${dX}px`);
		c.style.setProperty('--swipe-rotate', `${dX * 0.2}deg`);
		c.style.opacity = (1 - Math.min(Math.abs(dX) / 100, 1) * 0.75).toString();
	};

	const handleEnd = () => {
		if (!isSwiping || isHorizontalSwipe === false) {
			isSwiping = false;
			isHorizontalSwipe = null;
			return;
		}
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		const dX = currentX - startX;
		const t = 50,
			d = 300,
			c = getActiveCard();
		if (c) {
			c.style.transition = `transform ${d}ms ease, opacity ${d}ms ease`;
			if (Math.abs(dX) > t) {
				const dir = Math.sign(dX);
				c.style.setProperty('--swipe-x', `${dir * 300}px`);
				c.style.setProperty('--swipe-rotate', `${dir * 20}deg`);
				setTimeout(() => {
					if (getActiveCard() === c) c.style.setProperty('--swipe-rotate', `${-dir * 20}deg`);
				}, d * 0.5);
				setTimeout(() => {
					cardOrder = cardOrder.length === 0 ? [] : [...cardOrder.slice(1), cardOrder[0]];
				}, d);
			} else {
				applySwipeStyles(0);
			}
		}
		isSwiping = false;
		isHorizontalSwipe = null;
		startX = 0;
		currentX = 0;
	};

	const handleMove = (cX: number, cY: number) => {
		if (!isSwiping) return;
		if (isHorizontalSwipe === null) {
			const dx = Math.abs(cX - startX),
				dy = Math.abs(cY - startY);
			if (dx > 10 || dy > 10) {
				isHorizontalSwipe = dx > dy;
				if (!isHorizontalSwipe) {
					isSwiping = false;
					return;
				}
			} else return;
		}
		if (!isHorizontalSwipe) return;
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		animationFrameId = requestAnimationFrame(() => {
			currentX = cX;
			const dX = currentX - startX;
			applySwipeStyles(dX);
			if (Math.abs(dX) > 50) handleEnd();
		});
	};

	onMount(() => {
		const e = cardStackRef;
		if (!e) return;
		const oPD = (ev: PointerEvent) => {
			isSwiping = true;
			isHorizontalSwipe = null;
			startX = ev.clientX;
			startY = ev.clientY;
			currentX = ev.clientX;
			const c = getActiveCard();
			if (c) c.style.transition = 'none';
		};
		const oPM = (ev: PointerEvent) => {
			if (!isSwiping) return;
			handleMove(ev.clientX, ev.clientY);
		};
		const oPU = () => handleEnd();
		e.addEventListener('pointerdown', oPD);
		e.addEventListener('pointermove', oPM);
		e.addEventListener('pointerup', oPU);
		e.addEventListener('pointercancel', oPU);
		e.addEventListener('pointerleave', oPU);
		return () => {
			e.removeEventListener('pointerdown', oPD);
			e.removeEventListener('pointermove', oPM);
			e.removeEventListener('pointerup', oPU);
			e.removeEventListener('pointercancel', oPU);
			e.removeEventListener('pointerleave', oPU);
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	});

	$effect(() => {
		// re-run saat cardOrder berubah (setelah swipe) — reset posisi semua kartu
		void cardOrder;
		updatePositions();
	});
</script>

<div
	class="card-stack-container"
	bind:this={cardStackRef}
	style="width: {cW + 32}px; height: {cH + 32}px; position: relative; display: grid; placeContent: center; userSelect: none; transformStyle: preserve-3d; perspective: 700px; margin: 0 auto; touchAction: pan-y"
>
	{#each cardOrder as oI, dI (oI)}
		<div
			class="image-card"
			style="--i: {dI + 1}; z-index: {images.length - dI}; width: {cW}px; height: {cH}px; transform: perspective(700px) translateZ(calc(-12px * var(--i))) translateY(calc(7px * var(--i))) translateX(var(--swipe-x, 0px)) rotateY(var(--swipe-rotate, 0deg))"
		>
			<img
				src={images[oI]}
				alt="Foto {oI + 1}"
				style="width: 100%; height: 100%; object-fit: cover; pointer-events: none; border-radius: var(--radius-lg)"
				draggable={false}
			/>
		</div>
	{/each}
</div>
