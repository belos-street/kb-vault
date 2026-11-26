// 词汇台账（vocab-ledger.md）运行时只读解析。
// 台账是词汇释义的权威来源（见 english-lesson-crafter skill），
// 词群词在 lesson.json 中没有 meaning 字段，拼写在「看释义」时从这里兜底。

const modules = import.meta.glob('../../../book-*/vocab-ledger.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

/**
 * 解析「## 入账总表」小节内的表格行：
 * `| word | 核心释义 | 首次入账 | 词群 | 复现记录 | 状态 |`
 * 只取该小节，避免把「各讲复现率」「统计」等表格误收进词表。
 */
function parseLedger(raw: string): Map<string, string> {
  const map = new Map<string, string>()
  const start = raw.indexOf('## 入账总表')
  if (start === -1) return map
  const next = raw.indexOf('\n## ', start)
  const section = next === -1 ? raw.slice(start) : raw.slice(start, next)
  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').map((c) => c.trim())
    const word = cells[1]
    const meaning = cells[2]
    if (!word || !meaning || word === '词' || word.startsWith('-')) continue
    map.set(word.toLowerCase(), meaning)
  }
  return map
}

const meaningMap = new Map<string, string>()
for (const raw of Object.values(modules)) {
  for (const [word, meaning] of parseLedger(raw)) meaningMap.set(word, meaning)
}

/** 查台账释义（词形小写归并，如 Checks 归并到 check） */
export function ledgerMeaning(word: string): string | undefined {
  return meaningMap.get(word.toLowerCase())
}
