import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { SEED_PASSWORD, SEED_USERS } from './seed-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const passwordHash = await Bun.password.hash(SEED_PASSWORD)

await Promise.all(
  SEED_USERS.map((user) =>
    prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash }
    })
  )
)

console.log(
  `[seed] done: ${SEED_USERS.length} users (统一密码 ${SEED_PASSWORD})`
)
await prisma.$disconnect()
