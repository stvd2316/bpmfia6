import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Port 3000 + host: memungkinkan akses dari HP di jaringan lokal
	// (pengganti allowedDevOrigins pada next.config.ts)
	server: {
		port: 3000,
		host: true
	}
});
