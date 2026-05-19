import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['server/**/*.test.ts', 'app/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
})
