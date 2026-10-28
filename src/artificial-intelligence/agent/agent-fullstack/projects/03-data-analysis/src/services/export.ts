/** 报告落盘：图表 JSON 与 Markdown 正文（副作用统一收在这里） */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from '@/config.ts'
import type { ChartOption } from '@/prompts/chart-schema.ts'

/**
 * thread_id 会直接拼进报告目录，这里做白名单净化：
 * 去掉路径分隔符与首尾 .-，避免 `../` 或 `..` 把文件写出 REPORTS_DIR。
 */
export function safeThreadId(threadId: string): string {
  const safe = threadId
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 64)
  return safe || 'adhoc'
}

export function resolveReportDir(threadId: string): string {
  return `${config.REPORTS_DIR}/${safeThreadId(threadId)}`
}

function slugify(title: string): string {
  const slug = title
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return (slug || 'chart').slice(0, 30)
}

/** 写入 <dir>/charts/NN-<title>.json；先清空旧目录，避免重跑残留旧图 */
export async function saveCharts(
  dir: string,
  charts: ChartOption[]
): Promise<string[]> {
  const chartDir = join(dir, 'charts')
  await rm(chartDir, { recursive: true, force: true })
  await mkdir(chartDir, { recursive: true })
  const files: string[] = []
  // 顺序落盘是刻意行为（演示串行副作用）
  for (const [index, chart] of charts.entries()) {
    const file = join(
      chartDir,
      `${String(index + 1).padStart(2, '0')}-${slugify(chart.title.text)}.json`
    )
    await writeFile(file, JSON.stringify(chart, null, 2), 'utf8')
    files.push(file)
  }
  return files
}

/** 写入 <dir>/report.md，返回文件路径 */
export async function writeReport(
  dir: string,
  markdown: string
): Promise<string> {
  await mkdir(dir, { recursive: true })
  const file = join(dir, 'report.md')
  await writeFile(file, markdown, 'utf8')
  return file
}
