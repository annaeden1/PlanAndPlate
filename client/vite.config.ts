import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/userManagement': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/grocerylist': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/mealPlanner': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/barcode': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
});
