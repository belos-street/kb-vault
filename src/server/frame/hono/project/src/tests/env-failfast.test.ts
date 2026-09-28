import { describe, expect, it } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** FR-5 / 教程 §9 验收：清空 JWT_SECRET 启动必须报错退出，且指出缺哪项配置 */
describe('env fail-fast（FR-5）', () => {
  it('缺 JWT_SECRET 启动即退出（exit 1）并点名缺失项', () => {
    // cwd 放临时目录：脱离项目 .env，spawn 出的进程拿不到自动加载的 JWT_SECRET
    const cwd = mkdtempSync(join(tmpdir(), 'blog-env-'))
    const env: Record<string, string> = { ...process.env } as Record<
      string,
      string
    >
    delete env.JWT_SECRET
    const proc = Bun.spawnSync({
      cmd: [process.execPath, join(import.meta.dir, '..', 'index.ts')],
      cwd,
      env,
      stdout: 'pipe',
      stderr: 'pipe'
    })
    expect(proc.exitCode).toBe(1)
    const stderr = new TextDecoder().decode(proc.stderr)
    expect(stderr).toContain('JWT_SECRET')
  })
})
