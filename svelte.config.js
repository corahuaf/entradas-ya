import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// El adapter-auto configurará el despliegue en Vercel por ti
		adapter: adapter(),
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
