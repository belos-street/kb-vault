import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const users = [
  { email: 'admin@blog.dev', role: 'admin' },
  { email: 'editor@blog.dev', role: 'editor' },
  { email: 'alice@blog.dev', role: 'reader' },
  { email: 'bob@blog.dev', role: 'reader' },
]

const passwordHash = await Bun.password.hash('Passw0rd!123')

await Promise.all(
  users.map((user) =>
    prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    }),
  ),
)

console.log(`[seed] done: ${users.length} users (统一密码 Passw0rd!123)`)
await prisma.$disconnect()
