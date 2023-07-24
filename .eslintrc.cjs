/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:svelte/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['*.js', '*.cjs'],
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte'],
  },
  globals: {
    NodeJS: 'readable',
    google: 'readable',
    GeolocationPosition: 'readable',
    GeolocationPositionError: 'readable',
    $$Generic: 'readable',
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    {
      files: ['*.ts'],
      extends: ['plugin:import/recommended'],
      settings: {
        'import/resolver': {
          node: {
            extensions: ['.ts'],
          },
          typescript: {},
        },
      },
    },
    {
      files: ['./playwright.config.ts', './vite.config.ts'],
      parserOptions: {
        project: './tsconfig.workspace.json',
      },
    },
    {
      // additional files to scan (requires appropriate plugins)
      files: ['*.js', '*.cjs'],
    },
  ],
  rules: {
    // when using @ts-ignore you need to also include a description next to it
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': 'allow-with-description',
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        // allow unused function parameters that start with an underscore
        argsIgnorePattern: '^_',
        // allow destructuring of unused array elements that start with an underscore
        destructuredArrayIgnorePattern: '^_',
        // allow destructuring of unused fields in order to shrink an object shape
        ignoreRestSiblings: true,
      },
    ],
  },
}
