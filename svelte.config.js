import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Adapter para Vercel
		adapter: adapter(),
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
