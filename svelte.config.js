import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	compilerOptions: {
		// Struktur HTML dipertahankan 1:1 dari versi Next.js — nonaktifkan warning
		// a11y (bukan error, hanya membanjiri log build di Vercel).
		warningFilter: (warning) =>
			!warning.code.startsWith('a11y_') && warning.code !== 'state_referenced_locally'
	},

	kit: {
		// adapter-vercel: serverless functions untuk /api/* + static assets via CDN Vercel.
		// (adapter-node tidak kompatibel dengan Vercel — itu penyebab deploy gagal)
		adapter: adapter()
	}
};

export default config;
