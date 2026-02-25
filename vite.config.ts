import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        // Complex UI components excluded: async/audio/geolocation/TikTok API dependencies
        'src/components/PrayerTimesWidget.tsx',
        'src/components/QuickLinksSection.tsx',
        'src/components/TikTokAnnouncementsSection.tsx',
        'src/components/StorePreview.tsx',
        // QuranPage: 1000+ line interactive Quran reader, excluded from unit coverage
        'src/pages/QuranPage.tsx',
        // Pure TypeScript type declarations — no runtime behaviour to cover
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
