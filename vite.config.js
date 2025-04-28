import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config with the React plugin
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
