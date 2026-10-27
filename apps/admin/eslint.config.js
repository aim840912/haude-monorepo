import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.vite/'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // 允許未使用的變數以底線開頭
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // 降級為警告：在 useEffect 中設定狀態（常見的表單初始化模式）
      'react-hooks/set-state-in-effect': 'warn',
      // 錯誤記錄一律走 src/lib/logger（正式環境也會輸出 error，之後接監控只需改一處）
      'no-console': 'error',
    },
  },
  {
    // logger 本身是唯一允許直接呼叫 console 的地方
    files: ['src/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  }
)
