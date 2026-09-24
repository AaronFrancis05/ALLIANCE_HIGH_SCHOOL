/**
 * eslint-config-next 16 ships native flat configs, so they are spread in directly.
 * (The FlatCompat wrapper the template shipped with cannot load them.)
 */

import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  // Generated files and build output are never hand-edited, so they are not linted.
  {
    ignores: [
      '.next/',
      'node_modules/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/app/(payload)/admin/importMap.js',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      // AGENTS.md forbids `any` in committed code, so this is an error, not a warning.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Scripts and seeds run in Node and legitimately report progress on the console.
    files: ['scripts/**/*.ts', 'src/seed/**/*.ts', 'tests/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
]

export default eslintConfig
