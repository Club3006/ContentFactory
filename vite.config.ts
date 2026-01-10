import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed ones for backwards compatibility)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get API keys with fallbacks for both naming conventions
  const geminiKey = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';
  const apifyToken = env.VITE_APIFY_API_TOKEN || env.APIFY_API_TOKEN || '';
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/apify-proxy': {
          target: 'https://api.apify.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/apify-proxy/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      // Map both old process.env and new import.meta.env patterns
      'process.env.API_KEY': JSON.stringify(geminiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.APIFY_API_TOKEN': JSON.stringify(apifyToken),
      // Also expose via import.meta.env for modern code
      'import.meta.env.VITE_API_KEY': JSON.stringify(geminiKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
      'import.meta.env.VITE_APIFY_API_TOKEN': JSON.stringify(apifyToken)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
