import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [svelte(), tailwindcss()],
    // No dev proxy: the app calls the Express API directly at VITE_API_BASE_URL
    // (CORS is configured on the backend via FRONTEND_URL).
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
    },
  }
})
