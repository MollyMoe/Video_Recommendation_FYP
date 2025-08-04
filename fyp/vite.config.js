// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// import path from 'path'

// export default defineConfig({
//   base: './', // ✅ required for Electron to find assets
//   plugins: [
//     react(),
//     tailwindcss({
//       config: {
//         darkMode: 'class',
//         content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
//       },
//     }),
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, 'src'), // optional, useful for clean imports
//     },
//   },
//   server: {
//     port: 3000,
//     hmr: process.env.NODE_ENV !== 'production',
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
//   build: {
//     outDir: 'dist',
//     emptyOutDir: true,
//   },
// })

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // so <script src="./..."> works both in dev and in the packaged app
  base: "./",

  plugins: [
    react(),
    tailwindcss({
      config: {
        darkMode: "class",
        content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 3000,
    strictPort: true,
    hmr: process.env.NODE_ENV !== "production",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // <-- change this to avoid clashing with electron-builder’s "dist" folder
    outDir: "dist",

    // wipe only that folder on every build
    emptyOutDir: true,
  },
});
