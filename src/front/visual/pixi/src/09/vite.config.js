import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    fs: {
      // 允许访问上级目录的资源文件
      allow: ['..', '../..', '../../..'],
    },
  },
})
