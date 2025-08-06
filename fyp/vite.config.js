import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './', // ✅ required for Electron to find assets
  plugins: [
    react(),
    tailwindcss({
      config: {
        darkMode: 'class',
        content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // optional, useful for clean imports
    },
  },
  server: {
    port: 3000,
    strictPort: true, 
    hmr: process.env.NODE_ENV !== 'production',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
