import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), ],
  server: { host: '127.0.0.1', port: 5175, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:5080' } } },
});
