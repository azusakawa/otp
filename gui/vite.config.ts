import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        vite: { build: { outDir: 'dist/electron/main', rollupOptions: { external: ['electron'] } } },
      },
      {
        entry: 'electron/main/preload.ts',
        onstart(a) { a.reload(); },
        vite: { build: { outDir: 'dist/electron/main' } },
      },
    ]),
    renderer(),
  ],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist/renderer' },
});
