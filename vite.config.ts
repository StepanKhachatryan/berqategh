import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Produce pictures stay separate files, however small. Inlined they would
    // ride in the main bundle — ninety-seven of them ahead of first paint, all
    // re-downloaded on every code change, none of them lazy. As files they load
    // when a crop actually scrolls into view and stay in cache afterwards.
    assetsInlineLimit: (filePath) => (filePath.includes('assets/produce/') ? false : undefined),
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
