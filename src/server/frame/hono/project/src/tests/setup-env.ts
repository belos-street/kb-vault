// bunfig [test].preload：在每个测试文件的模块加载前执行。
// 把 DB / Redis 指向测试目标（DATABASE_URL_TEST / REDIS_URL_TEST），生产代码零改动——
// lib/env.ts 仍只认 DATABASE_URL，只是值在测试进程里被换成测试库。
//
// fail-fast：测试变量缺失直接退出，绝不静默回落到 dev 库——resetTestState 会 TRUNCATE，
// 打错目标库等于清空开发数据。
if (!process.env.DATABASE_URL_TEST || !process.env.REDIS_URL_TEST) {
  console.error(
    '[test] 缺少 DATABASE_URL_TEST / REDIS_URL_TEST（见 .env）——拒绝执行测试，防止 TRUNCATE 误伤 dev 库'
  )
  process.exit(1)
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
process.env.REDIS_URL = process.env.REDIS_URL_TEST
