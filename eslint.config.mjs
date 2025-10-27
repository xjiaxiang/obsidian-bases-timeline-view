import oxlint from 'eslint-plugin-oxlint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
	eslintPluginPrettierRecommended,
	...oxlint.configs['flat/recommended'], // oxlint should be the last one
	{
		ignores: ['dist'],
	},
];
