import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages 项目站点基路径（仓库开源，见 requirements.md Q1）
export default defineConfig({
  base: '/kb-vault/',
  plugins: [react()]
})
