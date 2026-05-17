import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appVersion = process.env.npm_package_version ?? '0.0.0'
const appCommitSha = process.env.VITE_APP_COMMIT_SHA ?? 'local'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT_SHA__: JSON.stringify(appCommitSha),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
