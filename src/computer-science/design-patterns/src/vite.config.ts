import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: '../doc',
  server: {
    port: 4200,
    open: true
  }
})
