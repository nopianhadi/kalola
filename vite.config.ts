import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [
      react()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'backend/**'],
    },
    // Enable compression
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      hmr: {
        overlay: false // Disable error overlay for better performance
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
    optimizeDeps: {
      force: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1200,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor core - split by package for better caching
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('html2pdf.js') || id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
              return 'vendor-others';
            }
            // Don't split types.ts or constants.tsx - keep them in main bundle to avoid circular deps
            if (id.includes('/types.ts') || id.includes('/constants.tsx')) {
              return undefined; // Keep in main bundle
            }
            return undefined;
          }
        }
      }
    }
  };
});
