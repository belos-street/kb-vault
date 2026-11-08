/**
 * 提示词层：上下文怎么拼、引用怎么解析。
 *
 * 这两件事都不该散落在编排代码里：
 * - 拼上下文决定模型看到什么、看到多少（成本）
 * - 解析引用决定答案能不能被追溯（可信度）
 */
import type { Chunk, ScoredChunk } from './types'

export const SYSTEM_PROMPT = [
  '你是一个基于知识库回答问题的助手。',
  '只能依据用户提供的资料作答，不要补充资料之外的事实。',
  '引用资料时在句末标注序号，例如 [1]；可以同时引用多条。',
  '资料不足以回答时，直接回答「知识库中没有找到相关内容。」'
].join('\n')

export interface BuiltContext {
  text: string
  /** 实际进入上下文的块，下标对应 [1] [2] ... */
  used: Chunk[]
}

/**
 * 按 [n] (chunkId) 文本 的格式拼接，累计长度不超过 maxChars。
 * 至少保留一条：一条都放不下时，宁超一点也要给出依据。
 */
export function buildContext(
  ranked: ScoredChunk[],
  maxChars: number
): BuiltContext {
  const lines: string[] = []
  const used: Chunk[] = []
  let length = 0

  for (const item of ranked) {
    const line = `[${used.length + 1}] (${item.chunk.id}) ${item.chunk.text}`
    const nextLength =
      lines.length === 0 ? line.length : length + 1 + line.length

    if (lines.length > 0 && nextLength > maxChars) break

    lines.push(line)
    used.push(item.chunk)
    length = nextLength
  }

  return { text: lines.join('\n'), used }
}

/**
 * 从答案里解析 [n]，映射回 chunk id。
 * 越界序号忽略，重复引用只保留第一次出现。
 */
export function parseCitations(answer: string, used: Chunk[]): string[] {
  const citations: string[] = []

  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const position = Number(match[1] ?? '')
    const chunk = used[position - 1]
    if (!chunk) continue
    if (!citations.includes(chunk.id)) {
      citations.push(chunk.id)
    }
  }

  return citations
}
