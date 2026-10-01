// src/services/workerUrl.ts
// Единая точка чтения VITE_WORKER_URL. Падает при сборке/старте, если переменной нет.

const url = import.meta.env.VITE_WORKER_URL;

if (!url || typeof url !== 'string') {
  throw new Error(
    'VITE_WORKER_URL is not set. Добавь переменную в .env.local (dev) и в Vercel Environment Variables (prod/preview).'
  );
}

export const WORKER_URL = url;