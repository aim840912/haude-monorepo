import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/', 'dist/', 'node_modules/'],
  },
  {
    rules: {
      // These rules don't exist in Next.js ESLint config
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Allow underscore-prefixed vars/args to be unused
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // 記錄一律走 src/lib/logger（生產環境保留 warn / error，之後接監控只需改一處）
      'no-console': 'error',
    },
  },
  {
    // logger 本身、測試與測試用 mock 可以直接呼叫 console
    files: ['src/lib/logger.ts', 'src/test/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  },
]

export default eslintConfig
