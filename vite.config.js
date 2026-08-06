import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base absolue : requis pour que le routing cote client (React Router) fonctionne
// sur les routes profondes (ex: /modules/eleves) lors d'un rechargement direct.
// Le deploiement Vercel sert l'app depuis la racine du domaine.
export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
          port: 5173,
          proxy: {
                  '/api': {
                            target: 'http://localhost:8080',
                            changeOrigin: true
                  }
          }
    },
    build: {
          outDir: 'dist',
          sourcemap: false
    }
})
