/**
 * 测试库初始化（M8）：`bun run test:setup`（`bun run test` 已自动串联）
 *
 * 1. prisma db push：幂等同步 schema 到 DATABASE_URL_TEST（库不存在时自动创建）
 * 2. prisma/seed.ts：upsert 种子用户（幂等）
 * 3. flushdb 测试 Redis（REDIS_URL_TEST 指向的独立 DB 下标）
 *
 * 显式 env 覆盖 DATABASE_URL/REDIS_URL 后，dotenv 不会用 .env 的 dev 值反覆盖
 * （dotenv 跳过已存在的变量），prisma.config.ts 与 seed.ts 因此都落在测试目标上。
 */
import { join } from 'node:path'

const testDb = process.env.DATABASE_URL_TEST
const testRedis = process.env.REDIS_URL_TEST
if (!testDb || !testRedis) {
  console.error(
    '[test:setup] 缺少 DATABASE_URL_TEST / REDIS_URL_TEST（见 .env）'
  )
  process.exit(1)
}
const root = join(import.meta.dir, '..')
const env = { ...process.env, DATABASE_URL: testDb, REDIS_URL: testRedis }

const push = Bun.spawnSync([process.execPath, 'x', 'prisma', 'db', 'push'], {
  cwd: root,
  env,
  stdout: 'inherit',
  stderr: 'inherit'
})
if (push.exitCode !== 0) process.exit(push.exitCode ?? 1)

const seed = Bun.spawnSync([process.execPath, join(root, 'prisma/seed.ts')], {
  cwd: root,
  env,
  stdout: 'inherit',
  stderr: 'inherit'
})
if (seed.exitCode !== 0) process.exit(seed.exitCode ?? 1)

const { redis } = await import('../src/lib/redis')
await redis.flushdb()
await redis.quit()
console.log('[test:setup] 测试库与测试 Redis 就绪')
