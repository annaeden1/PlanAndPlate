import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/userManagement': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/userManagement/, ''),
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
