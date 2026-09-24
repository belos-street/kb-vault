import 'dotenv/config' // Prisma CLI 沙箱不走 Bun 的 .env 自动加载，显式加载（Bun 应用侧仍走自动加载）
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
