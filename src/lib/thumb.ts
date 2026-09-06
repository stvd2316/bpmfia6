// Thumbnail precompute (opsi A): generate SEKALI saat upload, serve sebagai file kecil.
// Read path memakai thumb (belasan KB); fullview tetap file asli. Tanpa migrasi DB —
// nama thumb deterministik: <basename>-thumb.webp (server tidak menambah prefix tanggal
// untuk nama ini, jadi URL thumb bisa diturunkan langsung dari URL file asli).
// File lama yang belum punya thumb otomatis fallback ke cara lama (render di perangkat)
// + di-backfill diam-diam saat dilihat admin — tidak ada yang rusak.

export const THUMB_WIDTH = 600;

export function proxyUrl(url: string): string {
	return `/api/image?url=${encodeURIComponent(url)}`;
}

/** Ambil URL asli bila diberi URL proxy /api/image?url=... atau /api/download?url=... */
export function innerUrl(url: string): string | null {
	try {
		const u = new URL(url, 'http://x');
		if ((u.pathname === '/api/image' || u.pathname === '/api/download') && u.searchParams.get('url')) {
			return u.searchParams.get('url');
		}
		return url;
	} catch {
		return null;
	}
}

/** URL thumb R2 untuk sebuah URL file asli. null bila tidak bisa diturunkan. */
export function thumbUrlFor(original: string): string | null {
	const inner = innerUrl(original);
	if (!inner) return null;
	try {
		const u = new URL(inner);
		const parts = u.pathname.split('/');
		const name = parts.pop() || '';
		if (!name || name.endsWith('-thumb.webp')) return null;
		const dot = name.lastIndexOf('.');
		parts.push((dot > 0 ? name.slice(0, dot) : name) + '-thumb.webp');
		u.pathname = parts.join('/');
		u.search = '';
		u.hash = '';
		return u.toString();
	} catch {
		return null;
	}
}

/** Nama file thumb (untuk upload). */
export function thumbNameFor(original: string): string | null {
	const t = thumbUrlFor(original);
	if (!t) return null;
	try {
		return new URL(t).pathname.split('/').pop() || null;
	} catch {
		return null;
	}
}

// ---- pdfjs (lazy, hanya saat dibutuhkan) ----

let pdfjs: typeof import('pdfjs-dist') | null = null;

async function getPdfjs(): Promise<typeof import('pdfjs-dist')> {
	if (!pdfjs) {
		const mod = await import('pdfjs-dist');
		// $lib/pdfWorkerShim?worker&url: Vite mem-BUNDLE & TRANSPILE worker
		// (target safari15) + polyfill Promise.withResolvers di KONTEKS WORKER.
		const worker = await import('$lib/pdfWorkerShim?worker&url');
		mod.GlobalWorkerOptions.workerSrc = worker.default;
		pdfjs = mod;
	}
	return pdfjs;
}

async function renderTask(task: { promise: Promise<{ getPage: (n: number) => Promise<any> }> } & { destroy: () => Promise<void> }, targetW: number): Promise<HTMLCanvasElement> {
	const doc = await task.promise;
	try {
		const page = await doc.getPage(1);
		const vp1 = page.getViewport({ scale: 1 });
		const vp = page.getViewport({ scale: targetW / vp1.width });
		const canvas = document.createElement('canvas');
		canvas.width = Math.floor(vp.width);
		canvas.height = Math.floor(vp.height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('canvas 2d tidak tersedia');
		await page.render({ canvasContext: ctx, viewport: vp }).promise;
		return canvas;
	} finally {
		await task.destroy().catch(() => {});
	}
}

/** Render halaman pertama PDF ke canvas. Termasuk fallback fake-worker iOS 15.x. */
export async function renderPdfCanvas(
	source: string | ArrayBuffer,
	targetW: number = THUMB_WIDTH
): Promise<HTMLCanvasElement | null> {
	try {
		const lib = await getPdfjs();
		const makeTask = () =>
			typeof source === 'string' ? lib.getDocument({ url: source }) : lib.getDocument({ data: source });
		try {
			return await renderTask(makeTask(), targetW);
		} catch (e) {
			const isIOS =
				/iPad|iPhone|iPod/.test(navigator.userAgent) ||
				(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
			if (!isIOS) throw e;
			const savedWorker = (window as unknown as Record<string, unknown>).Worker;
			(window as unknown as Record<string, unknown>).Worker = undefined;
			try {
				return await renderTask(makeTask(), targetW);
			} finally {
				(window as unknown as Record<string, unknown>).Worker = savedWorker;
			}
		}
	} catch {
		return null;
	}
}

/** Encode canvas → Blob (WebP bila didukung, fallback JPEG untuk Safari). */
export function encodeThumb(canvas: HTMLCanvasElement, quality = 0.78): Promise<Blob | null> {
	let fmt = 'image/jpeg';
	try {
		if (canvas.toDataURL('image/webp', 1).startsWith('data:image/webp')) fmt = 'image/webp';
	} catch {
		fmt = 'image/jpeg';
	}
	return new Promise((res) => canvas.toBlob((b) => res(b), fmt, quality));
}

/** Kecilkan gambar (Blob webp) ke lebar target. */
export async function imageToThumb(blob: Blob, targetW: number = THUMB_WIDTH): Promise<Blob | null> {
	try {
		const bmp = await createImageBitmap(blob);
		try {
			const scale = bmp.width > targetW ? targetW / bmp.width : 1;
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.floor(bmp.width * scale));
			canvas.height = Math.max(1, Math.floor(bmp.height * scale));
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
			return await encodeThumb(canvas);
		} finally {
			bmp.close();
		}
	} catch {
		return null;
	}
}

/** Upload 1 file thumb ke R2 (nama deterministik, ditimpa bila sudah ada). */
export async function uploadThumbFile(name: string, blob: Blob): Promise<boolean> {
	try {
		const fd = new FormData();
		fd.append('files', new File([blob], name, { type: 'image/webp' }));
		const res = await fetch('/api/upload-files', { method: 'POST', body: fd });
		const data = await res.json().catch(() => null);
		return !!(
			data &&
			Array.isArray(data.urls) &&
			data.urls.some((u: unknown) => String(u).endsWith('/' + name))
		);
	} catch {
		return false;
	}
}

/** Hapus file + thumb-nya di R2 (dipakai saat hapus/ganti dokumen). Tidak pernah throw. */
export async function deleteFilesAndThumbs(urls: (string | null | undefined)[]): Promise<void> {
	const list = urls.filter((u): u is string => !!u);
	if (list.length === 0) return;
	try {
		await fetch('/api/delete-files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls: list })
		});
	} catch {
		/* abaikan — DB tetap jadi sumber kebenaran */
	}
}

// Guard agar tidak generate/upload ganda untuk file yang sama
const inflight = new Set<string>();

/**
 * Generate + upload thumb untuk file yang BARU diupload.
 * TIDAK PERNAH throw — aman dipanggil fire-and-forget agar tidak menghambat simpan.
 */
export async function generateAndUploadThumb(
	originalUrl: string,
	source: Blob | ArrayBuffer | string,
	kind: 'pdf' | 'image'
): Promise<void> {
	try {
		const name = thumbNameFor(originalUrl);
		if (!name || inflight.has(name)) return;
		inflight.add(name);
		try {
			let blob: Blob | null = null;
			if (kind === 'pdf') {
				const data = source instanceof Blob ? await source.arrayBuffer() : source;
				const canvas = await renderPdfCanvas(data);
				if (canvas) blob = await encodeThumb(canvas);
			} else {
				const b = source instanceof Blob ? source : new Blob([source]);
				blob = await imageToThumb(b);
			}
			if (blob) await uploadThumbFile(name, blob);
		} finally {
			inflight.delete(name);
		}
	} catch {
		/* abaikan — thumb opsional, simpan utama tidak boleh gagal karenanya */
	}
}

/** Backfill diam-diam dari canvas hasil render (dipanggil PdfThumbnail). Hanya admin. */
export async function backfillThumbFromCanvas(
	originalUrl: string,
	canvas: HTMLCanvasElement
): Promise<void> {
	try {
		const name = thumbNameFor(originalUrl);
		if (!name || inflight.has(name)) return;
		inflight.add(name);
		try {
			// Turunkan ke lebar thumb (canvas tampil bisa 900px — file simpan cukup 600px)
			const scale = canvas.width > THUMB_WIDTH ? THUMB_WIDTH / canvas.width : 1;
			const small = document.createElement('canvas');
			small.width = Math.max(1, Math.floor(canvas.width * scale));
			small.height = Math.max(1, Math.floor(canvas.height * scale));
			const ctx = small.getContext('2d');
			if (!ctx) return;
			ctx.drawImage(canvas, 0, 0, small.width, small.height);
			const blob = await encodeThumb(small);
			if (blob) await uploadThumbFile(name, blob);
		} finally {
			inflight.delete(name);
		}
	} catch {
		/* abaikan */
	}
}

/** Backfill diam-diam untuk gambar (dipanggil ThumbImg saat thumb 404). Hanya admin. */
export async function backfillImageThumb(originalUrl: string): Promise<void> {
	try {
		const name = thumbNameFor(originalUrl);
		if (!name || inflight.has(name)) return;
		inflight.add(name);
		try {
			const img = new Image();
			await new Promise<void>((res, rej) => {
				img.onload = () => res();
				img.onerror = () => rej(new Error('gagal muat gambar'));
				img.src = proxyUrl(originalUrl);
			});
			const scale = img.naturalWidth > THUMB_WIDTH ? THUMB_WIDTH / img.naturalWidth : 1;
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale));
			canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale));
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const blob = await encodeThumb(canvas);
			if (blob) await uploadThumbFile(name, blob);
		} finally {
			inflight.delete(name);
		}
	} catch {
		/* abaikan */
	}
}
