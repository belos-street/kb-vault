// scripts/verify-cursor.ts —— M1 验证点：cursor 翻页行数守恒（README 陷阱 #1 的回归工具）
// 运行：pnpm exec tsx scripts/verify-cursor.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { PostRepository } from '../src/modules/post/post.repository.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})
const repo = new PostRepository(prisma)

const TOTAL = 25
const TAKE = 10

// 清场（外键依赖顺序：session/post 先于 user）
await prisma.auditLog.deleteMany()
await prisma.session.deleteMany()
await prisma.post.deleteMany()
await prisma.user.deleteMany()

const author = await prisma.user.create({
  data: {
    email: 'verify@mini.local',
    passwordHash: 'verify-only',
    role: 'ADMIN',
  },
})
await prisma.post.createMany({
  data: Array.from({ length: TOTAL }, (_, i) => ({
    title: `post ${String(i + 1).padStart(2, '0')}`,
    content: 'verify',
    authorId: author.id,
  })),
})

// 连续翻页直到 nextCursor 为空
const collected: string[] = []
let cursor: string | undefined
let pages = 0
for (;;) {
  const { items, nextCursor } = await repo.list({ take: TAKE, cursor })
  pages++
  collected.push(...items.map(p => p.id))
  if (!nextCursor) break
  cursor = nextCursor
}

const unique = new Set(collected)
console.log(
  `pages=${pages} collected=${collected.length} unique=${unique.size} expect=${TOTAL}`,
)

const ok = collected.length === TOTAL && unique.size === TOTAL
console.log(ok ? 'PASS ✅ 行数守恒、无重复' : 'FAIL ❌ 行数不守恒或有重复')
await prisma.$disconnect()
process.exit(ok ? 0 : 1)
