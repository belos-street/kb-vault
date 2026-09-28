import { prisma } from '../lib/db'
import { redis } from '../lib/redis'
import { SEED_PASSWORD, SEED_USERS } from '../../prisma/seed-data'

const TRUNCATE_ALL =
  'TRUNCATE "User", "Post", "Comment", "AuditLog", "RefreshToken" RESTART IDENTITY CASCADE'

/**
 * 套件级重置（M8 / FR-11）：TRUNCATE 全表 + 重建种子用户 + 清测试 Redis。
 *
 * - bun test 的测试文件串行执行（实测 bun 1.4.2），beforeAll 里调用无并发干扰；
 *   外层事务回滚方案与 Prisma 每文件独立连接池冲突，不可用（TODO M8 记录）
 * - RESTART IDENTITY 让自增 id 每套件从 1 开始，配合 flushdb 防止旧缓存串台
 * - 双保险：URL 必须显式等于 DATABASE_URL_TEST，否则拒绝执行，防误伤 dev 库
 */
export async function resetTestState() {
  if (process.env.DATABASE_URL !== process.env.DATABASE_URL_TEST) {
    throw new Error(
      '[test] DATABASE_URL 未指向 DATABASE_URL_TEST，拒绝 TRUNCATE'
    )
  }
  await prisma.$executeRawUnsafe(TRUNCATE_ALL)
  const passwordHash = await Bun.password.hash(SEED_PASSWORD)
  await prisma.user.createMany({
    data: SEED_USERS.map((user) => ({ ...user, passwordHash }))
  })
  await redis.flushdb()
}
