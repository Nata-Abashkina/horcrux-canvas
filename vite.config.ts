import { defineConfig } from 'vite';

export default defineConfig({
  // Базовая настройка для удобной разработки в браузере
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    minify: 'terser' // Качественное сжатие итогового кода
  }
});
