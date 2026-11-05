import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
export default defineConfig(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.local/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'docs/evidence/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        HTMLElement: 'readonly',
        HTMLDialogElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLSelectElement: 'readonly',
        setInterval: 'readonly',
        requestAnimationFrame: 'readonly',
      },
    },
  },
  { files: ['**/*.astro'], languageOptions: { parserOptions: { parser: ts.parser } } },
);
