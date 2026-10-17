import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 部署子路径（requirements Q2）：/kb-vault/grammar-course/
export default defineConfig({
  base: '/kb-vault/grammar-course/',
  plugins: [react()]
})
