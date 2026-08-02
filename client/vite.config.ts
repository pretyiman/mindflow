import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Vite blocks requests with an unrecognized Host header by default (DNS-
    // rebinding protection) - the leading dot allows any ngrok-free.app
    // subdomain, so a new tunnel URL doesn't need this file touched again.
    allowedHosts: ['.ngrok-free.app'],
    // The client calls a relative /api path (see api/client.ts) precisely so
    // it keeps working through a tunnel opened on a different device -
    // "localhost:4000" in the browser would resolve to that device, not this
    // machine. Proxying /api here forwards it to the backend on the same
    // host Vite itself is running on, regardless of which origin the request
    // actually arrived through.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
