/**
 * 语料层：从 txt 文件加载长文本，按章节切成 Doc。
 *
 * 长文档先按「第X回 / 第X章」切分，再交给 chunker 做定长切块：
 * 这样每个块的 docId 都能直接定位到回目，引用可追溯。
 * 没有章节标记的文件会直接报错，避免整本书变成一个巨型 Doc。
 */
import type { Doc } from '../contracts/types'

const CHAPTER_HEADING = /^第[〇零一二三四五六七八九十百千两0-9]+[回章]/gm

export async function loadTxtDocs(path: string): Promise<Doc[]> {
  const file = Bun.file(path)
  if (!(await file.exists())) {
    throw new Error(`语料不存在：${path}`)
  }

  const raw = await file.text()
  const text = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim()

  if (text === '') {
    throw new Error(`语料为空：${path}`)
  }

  const headings = [...text.matchAll(CHAPTER_HEADING)]
  if (headings.length === 0) {
    throw new Error(`未识别到章节标题（第X回 / 第X章）：${path}`)
  }

  return headings.map((heading, position) => {
    const start = heading.index ?? 0
    const end = headings[position + 1]?.index ?? text.length
    return {
      id: heading[0].trim(),
      // 章节标题留在正文里，标题里的关键词也能参与检索
      text: text.slice(start, end).trim()
    }
  })
}
