import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { localApiPlugin } from './vite.local-api.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value.replace(/\r/g, '')
  }

  return {
    plugins: [react(), localApiPlugin()],
  }
})
