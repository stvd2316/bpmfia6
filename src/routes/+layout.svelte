<script lang="ts">
	import '../app.css';

	// Font self-host (tanpa request eksternal ke Google Fonts):
	// @import eksternal di CSS bersifat blocking — kalau fonts.googleapis.com
	// lambat/diblokir (sering di jaringan Indonesia), iOS Safari menunda penerapan
	// SELURUH stylesheet → halaman tampil tanpa styling. Font di-bundle oleh Vite.
	import '@fontsource/lato/400.css';
	import '@fontsource/lato/700.css';
	import '@fontsource/montserrat/400.css';
	import '@fontsource/montserrat/600.css';
	import '@fontsource/montserrat/700.css';

	let { children } = $props();
</script>

{@render children()}
