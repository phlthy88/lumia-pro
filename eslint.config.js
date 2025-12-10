import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // DOM types that ESLint doesn't recognize
        MediaRecorderOptions: 'readonly',
        IntersectionObserverCallback: 'readonly',
        IntersectionObserverInit: 'readonly',
        OffscreenCanvas: 'readonly',
        ImageBitmap: 'readonly',
        MediaStreamTrack: 'readonly',
        MediaStream: 'readonly',
        BlobEvent: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLProgram: 'readonly',
        WebGLShader: 'readonly',
        WebGLTexture: 'readonly',
        WebGLBuffer: 'readonly',
        WebGLUniformLocation: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // TypeScript handles this
      // Enforce module boundaries
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*'],
              message: 'Avoid deep relative imports. Use barrel exports instead.',
            },
          ],
        },
      ],
      // Prevent race conditions
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'public/wasm/**', 'test/**', 'lighthouserc.js', 'public/sw.js', 'e2e/**'],
  },
];
