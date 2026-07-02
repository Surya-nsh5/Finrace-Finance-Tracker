import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'build',
    // Revert to esbuild for faster and more stable builds while maintaining production quality
    minify: 'esbuild',
    // Remove console logs and debuggers from production build
    esbuild: {
      drop: ['console', 'debugger'],
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // More robust chunking strategy to prevent "Object.defineProperty" errors
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['react-icons', 'emoji-picker-react', 'react-hot-toast'],
          'vendor-utils': ['axios', 'moment']
        }
      }
    },
    // Enable source maps only if needed
    sourcemap: false,
    // Optimize CSS handling
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 4096 // 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    exclude: []
  },
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    tailwindcss(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: true },
      avif: { lossless: true }
    })
  ],
  // Server configuration for development
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false
  }
})
