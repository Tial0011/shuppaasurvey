import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  build: { chunkSizeWarningLimit: 900 },
});
