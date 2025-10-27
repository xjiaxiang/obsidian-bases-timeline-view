export default {
	'*.md': ['prettier --write'],
	'*.{ts,js,cjs,mjs,tsx}': ['oxlint && eslint'],
};
