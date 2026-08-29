import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Leaflet and supabase-js are both large enough to be worth splitting out
    // of the app chunk, so a code change does not invalidate them in cache.
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'leaflet', test: /node_modules\/leaflet/ },
            { name: 'supabase', test: /node_modules\/@supabase/ },
          ],
        },
      },
    },
  },
});
