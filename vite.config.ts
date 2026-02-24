import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
    electron([
      {
        // Main Process
        entry: 'electron/main.ts',
        vite: {
          define: {
            'process.env.APP_TOKEN': JSON.stringify(env.APP_TOKEN ?? ''),
            'process.env.BOT_TOKEN': JSON.stringify(env.BOT_TOKEN ?? ''),
          },
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'electron-store',
                '@slack/socket-mode',
                '@slack/web-api',
              ],
            },
          },
        },
      },
      {
        // Preload Script
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer Process to reload the page when the Preload Scripts build is complete
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  };
});
