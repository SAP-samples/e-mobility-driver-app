import cds from '@sap/cds/eslint.config.mjs';
import tsEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import vue from 'eslint-plugin-vue';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';

const vueEslintParser = await import('vue-eslint-parser');
const tsEslintParser = await import('@typescript-eslint/parser');

export default [
  {
    ignores: ['**/dist/', '**/node_modules/', '**/coverage/', 'gen/'],
  },
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: tsEslintParser,
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.jest,
        sap: true,
        SELECT: true,
        INSERT: true,
        UPDATE: true,
        DELETE: true,
        CREATE: true,
        DROP: true,
        CDL: true,
        CQL: true,
        CXL: true,
        cds: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier,
      vue,
      'import-x': importPlugin,
    },
    rules: {
      ...(vue.configs['vue3-recommended']?.rules ?? {}),
      ...(tsEslint.configs.recommended?.rules ?? {}),
      ...(importPlugin.configs['flat/recommended']?.rules ?? {}),
      'prettier/prettier': 'error',
      'import-x/no-unresolved': 'off',
      'import-x/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@sap/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: [],
          'newlines-between': 'always',
        },
      ],
      'sort-imports': [
        'error',
        { ignoreDeclarationSort: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
    },
  },
  ...cds.recommended,
];