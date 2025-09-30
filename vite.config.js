import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  
  // PostCSS inline: garantisce l'esecuzione di Tailwind/Autoprefixer in build
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  
  // Assicura che Tailwind usi la config CJS esplicita in ambienti dove ESM può fallire
  // Tailwind la rileva automaticamente, ma in alcuni contesti di build dockerizzati
  // è più affidabile avere il file .cjs presente accanto.
  
  // Ottimizzazioni per le performance
  build: {
    // Genera source maps solo in development
    sourcemap: false,
    
    // Ottimizzazioni per il bundle
    rollupOptions: {
      output: {
        // Chunk splitting per migliorare il caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        },
        
        // Nomi dei file con hash per il caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      external: [],
      plugins: []
    },
    
    // Target per browser moderni
    target: 'es2015',
    
    // Dimensione warning
    chunkSizeWarningLimit: 1000
  },
  
  // Ottimizzazioni per il server di sviluppo
  server: {
    // Compressione gzip
    compress: true
  },
  
  // Ottimizzazioni per le dipendenze
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ]
  },
  
  // Configurazione per definire variabili globali
  define: {
    global: 'globalThis',
  },
  
  // Configurazione per le immagini
  assetsInclude: ['**/*.webp', '**/*.jpg', '**/*.png', '**/*.svg']
})
