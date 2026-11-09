/**
 * 切块层：把长文档切成可检索的小块。
 *
 * 按字符窗口切，允许相邻块重叠。重叠是为了防止一句话被切断后
 * 两边都检索不到。真实项目里还会按段落 / 标点对齐，这里保持最小实现。
 */
import { DEFAULT_RAG_OPTIONS, type Chunk, type Doc } from '../contracts/types'

export function chunkDocuments(
  docs: Doc[],
  chunkSize = DEFAULT_RAG_OPTIONS.chunkSize,
  chunkOverlap = DEFAULT_RAG_OPTIONS.chunkOverlap
): Chunk[] {
  if (chunkSize <= 0) {
    throw new RangeError(`chunkSize 必须大于 0，收到 ${chunkSize}`)
  }
  if (chunkOverlap < 0) {
    throw new RangeError(`chunkOverlap 不能为负，收到 ${chunkOverlap}`)
  }
  if (chunkOverlap >= chunkSize) {
    throw new RangeError(
      `chunkOverlap 必须小于 chunkSize，收到 ${chunkOverlap} >= ${chunkSize}`
    )
  }

  const step = chunkSize - chunkOverlap
  const chunks: Chunk[] = []

  for (const doc of docs) {
    const text = doc.text.trim()
    if (text === '') continue

    let index = 0
    for (let start = 0; start < text.length; start += step) {
      const piece = text.slice(start, start + chunkSize)
      // 空白块没有检索价值，跳过且不占序号
      if (piece.trim() !== '') {
        chunks.push({ id: `${doc.id}#${index}`, docId: doc.id, text: piece })
        index += 1
      }
      if (start + chunkSize >= text.length) break
    }
  }

  return chunks
}
