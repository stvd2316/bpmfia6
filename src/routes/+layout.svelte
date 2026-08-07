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
