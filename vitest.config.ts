import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// vite.config.ts と分離 — electron プラグインをテスト環境に含めない
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // デフォルト: React コンポーネント用
    setupFiles: ['src/test/setup.ts'],
    environmentMatchGlobs: [
      // electron/ 配下のテストは Node.js 環境で実行
      ['electron/**/*.test.ts', 'node'],
    ],
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'electron/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/main.tsx',
        'src/data/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
});
