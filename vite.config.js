import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' + HashRouter => funziona su GitHub Pages in qualsiasi sottocartella
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
