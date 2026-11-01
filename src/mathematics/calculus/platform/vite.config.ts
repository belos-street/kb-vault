import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 与知识库站点同级部署：/kb-vault/calculus/
export default defineConfig({
  base: '/kb-vault/calculus/',
  plugins: [react()]
})
