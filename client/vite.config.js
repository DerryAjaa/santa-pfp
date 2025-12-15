import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${Number(process.env.VITE_API_PORT || process.env.API_PORT || 5001)}`
    }
  }
});
