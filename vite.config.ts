import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// something i sup with sveltekit vite typings, so we'll just skipt this rule for now
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
