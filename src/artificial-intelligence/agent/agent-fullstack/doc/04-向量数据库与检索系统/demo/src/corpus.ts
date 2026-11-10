import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface Chunk {
  // 稳定主键：文档 ID + 块序号，重复入库时用于幂等覆盖
  id: string
  docId: string
  title: string
  // 租户 / 权限标签，检索时下推到 filter（见 4.5）
  tenantId: string
  visibility: 'public' | 'internal'
  text: string
}

const DOCS_DIR = join(import.meta.dir, '../data/docs')

// 最小切分：按二级标题切段。真实项目用递归切分 + 重叠窗口（见 4.5）。
const splitByHeading = (content: string): string[] => {
  const sections = content
    .split(/\n(?=## )/g)
    .map((section) => section.trim())
    .filter(Boolean)
  return sections.flatMap((section) => {
    if (section.length <= 600) return [section]
    const paragraphs = section.split(/\n\n+/g)
    const chunks: string[] = []
    let buffer = ''
    for (const paragraph of paragraphs) {
      if ((buffer + paragraph).length > 600 && buffer) {
        chunks.push(buffer.trim())
        buffer = ''
      }
      buffer += `${paragraph}\n\n`
    }
    if (buffer.trim()) chunks.push(buffer.trim())
    return chunks
  })
}

export const loadChunks = async (): Promise<Chunk[]> => {
  const files = (await readdir(DOCS_DIR))
    .filter((file) => file.endsWith('.md'))
    .sort()

  const chunks: Chunk[] = []
  for (const file of files) {
    const raw = await readFile(join(DOCS_DIR, file), 'utf8')
    const docId = file.replace(/\.md$/, '')
    const title = raw.match(/^#\s+(.+)$/m)?.[1] ?? docId
    const visibility = raw.includes('visibility: internal')
      ? 'internal'
      : 'public'

    splitByHeading(raw).forEach((text, index) => {
      chunks.push({
        id: `${docId}#${index}`,
        docId,
        title,
        tenantId: 'acme',
        visibility,
        text
      })
    })
  }
  return chunks
}
