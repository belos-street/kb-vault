import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 部署子路径已裁定（requirements A1 决策记录）：/kb-vault/grammar-play/
export default defineConfig({
  base: '/kb-vault/grammar-play/',
  plugins: [react()]
})
