/*
 * CONFIGURAÇÃO DO VITE (a ferramenta que roda e empacota o site)
 */
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Endereço do servidor da API (pasta servidor/)
const API = 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  // Ativa o suporte a arquivos .vue
  plugins: [vue()],
  resolve: {
    alias: {
      // Permite importar escrevendo "@/..." no lugar de "../../src/..."
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // "Ponte" entre o site (porta 5173) e a API (porta 3001)
    proxy: {
      // /api/videos -> http://localhost:3001/videos
      '/api': {
        target: API,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Arquivos de vídeo enviados pelos usuários
      '/uploads': {
        target: API,
        changeOrigin: true,
      },
    },
  },
})
