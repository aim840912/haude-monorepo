/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // 傳統茶藝主色調
        'primary-tea': 'var(--primary-tea)',
        'primary-tea-hover': 'var(--primary-tea-hover)',
        'primary-tea-light': 'var(--primary-tea-light)',
        'primary-tea-bg': 'var(--primary-tea-bg)',
        // 綠色輔助色
        'primary-green': 'var(--primary-green)',
        'primary-green-hover': 'var(--primary-green-hover)',
        'primary-green-light': 'var(--primary-green-light)',
        'primary-green-bg': 'var(--primary-green-bg)',
        // 點綴色
        'accent-gold': 'var(--accent-gold)',
        'accent-gold-hover': 'var(--accent-gold-hover)',
        'accent-red': 'var(--accent-red)',
        // 卡片與面板
        'card-bg': 'var(--card-bg)',
        'card-bg-secondary': 'var(--card-bg-secondary)',
        'card-border': 'var(--card-border)',
        // 文字顏色
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        // 輸入框
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'input-border-focus': 'var(--input-border-focus)',
        // Hover
        'hover-bg': 'var(--hover-bg)',
        divider: 'var(--divider)',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'Georgia', 'serif'],
        display: ['Noto Sans TC', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Noto Sans TC', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-reverse': 'spin-reverse 1s linear infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
