module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'no-undef': 'off', // Disable for TypeScript
    'no-unused-vars': 'off', // Use TypeScript version instead
  },
  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      env: {
        browser: true,
      },
    },
    {
      files: ['**/*.test.*', '**/*.spec.*'],
      env: {
        jest: true,
        mocha: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.js',
    '!.eslintrc.js',
    'coverage/',
  ],
};