import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build en chemin relatif : permet de deployer le dossier "dist" dans n'importe
// quel sous-dossier de cPanel (public_html/ ou public_html/app/) sans reconfiguration.
export default defineConfig({
    plugins: [react()],
    base: './',
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
