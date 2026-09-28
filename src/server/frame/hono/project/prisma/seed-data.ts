/** 种子数据单一来源：prisma/seed.ts 与测试套件 reset-db 共用（改这里，两处同时生效） */
export const SEED_PASSWORD = 'Passw0rd!123'

export const SEED_USERS = [
  { email: 'admin@blog.dev', role: 'admin' },
  { email: 'editor@blog.dev', role: 'editor' },
  { email: 'alice@blog.dev', role: 'reader' },
  { email: 'bob@blog.dev', role: 'reader' }
] as const
