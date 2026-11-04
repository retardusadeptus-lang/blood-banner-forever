import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load .env so the dev proxy targets whatever port the backend uses (API_PORT preferred).
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.API_PORT || env.PORT || '4000'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3002,
      strictPort: false,
      // Forward /api to the backend so the frontend can use a same-origin relative
      // path in dev (matches the nginx proxy used in the Docker image).
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
