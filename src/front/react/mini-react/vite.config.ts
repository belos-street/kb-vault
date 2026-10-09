import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 多页面入口（篇 12）：index.html 跑官方 react 对照组，mini.html 跑 mini-react
const input = (name: string): string =>
  fileURLToPath(new URL(`./playground/${name}`, import.meta.url))

export default defineConfig({
  root: 'playground',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: input('index.html'),
        mini: input('mini.html')
      }
    }
  }
})
