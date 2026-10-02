import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			obsidian: fileURLToPath(new URL('./tests/stubs/obsidian.ts', import.meta.url)),
		},
	},
	test: {},
});
