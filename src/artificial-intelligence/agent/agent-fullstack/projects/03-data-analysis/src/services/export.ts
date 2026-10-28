/** 报告落盘：图表 JSON 与 Markdown 正文（副作用统一收在这里） */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ChartOption } from '@/prompts/chart-schema.ts'

// oxlint: eslint(no-await-in-loop) —— 顺序落盘是刻意行为（演示串行副作用）
function slugify(title: string): string {
  const slug = title
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return (slug || 'chart').slice(0, 30)
}

/** 写入 <dir>/charts/NN-<title>.json，返回文件路径列表 */
export async function saveCharts(
  dir: string,
  charts: ChartOption[]
): Promise<string[]> {
  const chartDir = join(dir, 'charts')
  await mkdir(chartDir, { recursive: true })
  const files: string[] = []
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
