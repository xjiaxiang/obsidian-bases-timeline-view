import { defineConfig } from 'vite';

import builtins from 'builtin-modules';

// https://vite.dev/config/
export default defineConfig({
	plugins: [],
	build: {
		lib: {
			entry: 'src/main.ts',
			fileName: 'main',
			formats: ['cjs'],
			cssFileName: 'styles',
		},
		minify: false,
		emptyOutDir: true,
		rollupOptions: {
			output: {
				dir: 'dist',
			},
			external: [
				'obsidian',
				'electron',
				'@codemirror/autocomplete',
				'@codemirror/collab',
				'@codemirror/commands',
				'@codemirror/language',
				'@codemirror/lint',
				'@codemirror/search',
				'@codemirror/state',
				'@codemirror/view',
				'@lezer/common',
				'@lezer/highlight',
				'@lezer/lr',
				...builtins,
			],
		},
	},
});
