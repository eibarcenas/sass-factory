import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        wa: '#25D366',
        ink: { 950: '#0A0A0A', 900: '#111111', 800: '#161616' },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
