import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules', '**/dist']
  },

  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js}'],
    plugins: {
      'unused-imports': eslintPluginUnusedImports,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier
    },
    rules: {
      // prevent files from creeping over 300 lines
      'max-lines': 'error',

      // run prettier as an ESLint rule
      'prettier/prettier': 'error',

      // align import rules for better auto fixing
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true }
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'object',
            'type'
          ],
          pathGroups: [
            {
              pattern: '**/*.{svg,png,jpg,json,md,mdx}',
              group: 'object',
              position: 'after'
            }
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc'
          }
        }
      ],

      // Allow `require`
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  eslintConfigPrettier
);
