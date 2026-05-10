import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/fury-api': {
        target: 'https://api-wj2a2vwtsq-uc.a.run.app',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/fury-api/, ''),
      },
    },
  },
})
