/**
 * 报告目录与图表落盘（路径安全 / 重跑去残留）
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ChartOption } from '@/prompts/chart-schema.ts'
import {
  resolveReportDir,
  safeThreadId,
  saveCharts
} from '@/services/export.ts'

function chart(title: string): ChartOption {
  return {
    title: { text: title },
    series: [{ name: title, type: 'bar', data: [1, 2] }]
  }
}

describe('报告目录', () => {
  it('净化 thread_id，阻断路径穿越', () => {
    expect(safeThreadId('../../x')).toBe('x')
    expect(safeThreadId('..')).toBe('adhoc')
    expect(safeThreadId('a/b:c')).toBe('a-b-c')
    expect(safeThreadId('华南-01')).toBe('华南-01')
    expect(resolveReportDir('../../x').endsWith('/x')).toBe(true)
  })

  it('重跑时清空旧图表文件', async () => {
    const dir = await mkdtemp(join(tmpdir(), '03-charts-'))
    try {
      await saveCharts(dir, [chart('旧图A'), chart('旧图B')])
      expect(await readdir(join(dir, 'charts'))).toHaveLength(2)

      await saveCharts(dir, [chart('新图')])
      const files = await readdir(join(dir, 'charts'))
      expect(files).toHaveLength(1)
      expect(files[0]).toContain('新图')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
