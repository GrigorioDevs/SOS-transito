import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: { name: 'SOS Trânsito - Cliente', short_name: 'SOS Cliente', lang: 'pt-BR', start_url: '/', scope: '/', display: 'standalone', theme_color: '#171717', background_color: '#FFFFFF', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/hubs(?:\/|$)/],
        runtimeCaching: [{ urlPattern: /\/api(?:\/|$)/, handler: 'NetworkOnly' }],
      },
      devOptions: { enabled: false },
    })],
  server: { host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:5080' } } },
});
