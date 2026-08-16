import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Port 3000 + host: memungkinkan akses dari HP di jaringan lokal
	// (pengganti allowedDevOrigins pada next.config.ts)
	server: {
		port: 3000,
		host: true
	},
	// PENTING iOS: target Safari 15 (iPhone 7 / iOS 15.8) — tanpa ini Vite
	// memakai default 'baseline-widely-available' (≈Safari 16+) yang bisa
	// menghasilkan sintaks tidak didukung iPhone lama → beberapa komponen
	// error/tidak termuat di iOS. Safari 15 tetap jalan di browser modern.
	build: {
		target: 'safari15'
	}
});
