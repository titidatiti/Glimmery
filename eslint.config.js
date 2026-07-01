import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'vitest.config.ts', 'vitest.setup.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/core',
              from: ['./src/features', './src/app'],
              message: 'core 层不得依赖 features 或 app',
            },
            {
              target: './src/core',
              from: './src/services/**/adapters/**',
              message: 'core 层不得依赖 services 具体适配器',
            },
            {
              target: './src/features/editor',
              from: './src/features/!(editor)/**',
              message: 'features 之间不得互相 import',
            },
            {
              target: './src/features/document-list',
              from: './src/features/!(document-list)/**',
              message: 'features 之间不得互相 import',
            },
            {
              target: './src/features/document-search',
              from: './src/features/!(document-search)/**',
              message: 'features 之间不得互相 import',
            },
            {
              target: './src/features/settings-dialog',
              from: './src/features/!(settings-dialog)/**',
              message: 'features 之间不得互相 import',
            },
            {
              target: './src/features/theme-switcher',
              from: './src/features/!(theme-switcher)/**',
              message: 'features 之间不得互相 import',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message: 'core 层不得 import React',
            },
          ],
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*'],
              message: 'core 层不得 import React',
            },
          ],
        },
      ],
    },
  },
);
