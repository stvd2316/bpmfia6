<script module>
	// PENTING iOS (iPhone 7 / iOS 15.8): Promise.withResolvers baru ada di
	// Safari 17.4+ — pdfjs-dist memakainya (30×) → tanpa polyfill ini,
	// thumbnail PDF gagal dimuat di iOS. Polyfill berjalan paling awal
	// (module script dieksekusi sebelum komponen mana pun di-instantiate).
	if (typeof (Promise as any).withResolvers === 'undefined') {
		(Promise as any).withResolvers = function () {
			let resolve: (value: unknown) => void = () => {};
			let reject: (reason?: unknown) => void = () => {};
			const promise = new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		};
	}
</script>

<script lang="ts">
	import '../app.css';

	// Font self-host (tanpa request eksternal ke Google Fonts):
	// @import eksternal di CSS bersifat blocking — kalau fonts.googleapis.com
	// lambat/diblokir (sering di jaringan Indonesia), iOS Safari menunda penerapan
	// SELURUH stylesheet → halaman tampil tanpa styling. Font di-bundle oleh Vite.
	// Hanya subset latin yang di-import (cyrillic/latin-ext/vietnamese tidak
	// dipakai) — 5 file woff2, bukan 19.
	import '@fontsource/lato/latin-400.css';
	import '@fontsource/lato/latin-700.css';
	import '@fontsource/montserrat/latin-400.css';
	import '@fontsource/montserrat/latin-600.css';
	import '@fontsource/montserrat/latin-700.css';

	let { children } = $props();
</script>

{@render children()}
