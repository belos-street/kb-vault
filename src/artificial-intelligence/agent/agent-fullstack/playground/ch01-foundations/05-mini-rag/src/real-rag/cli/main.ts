/**
 * 演示入口：真实语料 + 真实模型 + 真实向量。
 *
 * 在 real-rag 目录运行：
 *   bun run cli/main.ts                                   # 默认三国演义，交互问答
 *   bun run cli/main.ts data/sanguo.txt                   # 指定语料
 *   bun run cli/main.ts data/sanguo.txt "桃园结义的是谁"    # 只问一次
 *
 * 对话模型需要 .env 里的 OPENAI_API_KEY；
 * 向量默认走本地 Ollama 的 bge-m3（见 .env 的 EMBEDDING_*）。
 */
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { chunkDocuments } from '../ingest/chunker'
import { loadTxtDocs } from '../ingest/corpus'
import { createDefaultEmbedder } from '../providers/embedding'
import { answerWithCitations } from '../generation/rag'
import { indexChunks } from '../retrieval/retriever'
import type { RagAnswer } from '../contracts/types'

const DEFAULT_CORPUS = 'data/sanguo.txt'
const DEMO_QUESTIONS = [
  '桃园结义的是谁？',
  '赤壁之战是谁放的火？',
  '诸葛亮最后是怎么死的？'
]

function printAnswer(result: RagAnswer): void {
  console.log(`答：${result.answer}`)

  if (result.citations.length > 0) {
    console.log(`引用：${result.citations.join('、')}`)
  }

  if (result.ranked.length > 0) {
    const top = result.ranked.slice(0, 5)
    console.log(`召回（前 ${top.length}/${result.ranked.length}）：`)
    top.forEach((item, position) => {
      const preview = item.chunk.text.replace(/\s+/g, ' ').slice(0, 60)
      console.log(
        `  [${position + 1}] ${item.score.toFixed(3)} ${item.chunk.id} ${preview}...`
      )
    })
    console.log(`上下文：${result.chunks.map((chunk) => chunk.id).join('、')}`)
  }

  if (result.usage) {
    console.log(`用量：${result.usage.totalTokens} tokens`)
  }
}

async function main(): Promise<void> {
  const [corpusPath = DEFAULT_CORPUS, ...questionParts] = process.argv.slice(2)
  const embedder = createDefaultEmbedder()

  const docs = await loadTxtDocs(corpusPath)
  const totalChars = docs.reduce((sum, doc) => sum + doc.text.length, 0)
  console.log(`语料：${corpusPath}（${docs.length} 章 / ${totalChars} 字）`)
  console.log(`向量：${embedder.id}`)

  // 索引只建一次：整本书向量化很贵，后续每个问题只向量化 query
  const chunks = chunkDocuments(docs)
  console.log(`索引：${chunks.length} 块，正在向量化（约 1-2 分钟）...`)
  const started = performance.now()
  const index = await indexChunks(chunks, embedder)
  const elapsed = (performance.now() - started) / 1000
  console.log(`索引：${index.length} 块，耗时 ${elapsed.toFixed(1)}s`)

  const ask = async (question: string): Promise<void> => {
    const result = await answerWithCitations(
      question,
      docs,
      // 召回 12 个小块，按回聚合成整章后最多喂 12000 字
      { topK: 12, maxContextChars: 12000, expandToDocs: true },
      { embedder, index }
    )
    printAnswer(result)
  }

  const question = questionParts.join(' ').trim()
  if (question !== '') {
    await ask(question)
    return
  }

  console.log(`示例：${DEMO_QUESTIONS.join(' | ')}`)
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    while (true) {
      const input = (await rl.question('\n问（exit 退出）：')).trim()
      if (input === 'exit' || input === 'quit') return
      if (input === '') continue
      await ask(input)
    }
  } finally {
    rl.close()
  }
}

if (import.meta.main) {
  await main()
}
