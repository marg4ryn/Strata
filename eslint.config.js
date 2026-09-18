import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'test-setup.ts', 'vitest.config.ts'],
  },

  // --- TypeScript + Angular ---
  {
    files: ['**/*.ts'],

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],

    processor: angular.processInlineTemplates,

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },

      'boundaries/include': ['src/app/**/*.ts'],

      'boundaries/ignore': [
        'src/app/app.ts',
        'src/app/app.config.ts',
        'src/app/app.routes.ts',
        'src/app/app.spec.ts',
        'src/app/app.html',
      ],

      'boundaries/elements': [
        {
          type: 'core',
          pattern: 'src/app/core/*',
          capture: ['moduleName'],
        },
        {
          type: 'feature',
          pattern: 'src/app/features/*',
          capture: ['moduleName'],
        },
        {
          type: 'layout',
          pattern: 'src/app/layout/*',
          capture: ['moduleName'],
        },
        {
          type: 'shared',
          pattern: 'src/app/shared/*',
          capture: ['moduleName'],
        },
      ],
    },

    plugins: { boundaries },

    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],

      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: { type: ['core', 'shared', 'feature'], fileInternalPath: 'index.ts' },
                },
              },
            },
            {
              from: { element: { type: 'layout' } },
              allow: {
                to: {
                  element: { type: ['core', 'shared', 'feature'], fileInternalPath: 'index.ts' },
                },
              },
            },
            {
              from: { element: { type: 'core' } },
              allow: {
                to: { element: { type: ['core', 'shared'], fileInternalPath: 'index.ts' } },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: {
                to: { element: { type: ['core', 'shared'], fileInternalPath: 'index.ts' } },
              },
            },
          ],
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
    },
  },

  // --- Tests ---
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // --- Disallow export * in index.ts files ---
  {
    files: ['**/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'index.ts must use explicit exports (export { X } from ...); export * is forbidden.',
        },
      ],
    },
  },

  // --- Angular templates ---
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },

  // --- Prettier disables formatting-related rules ---
  prettierConfig,
);
