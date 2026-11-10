import { QdrantClient } from '@qdrant/js-client-rest'
import { loadChunks } from './corpus.ts'
import { EMBEDDING_DIM, embed, embedChunk } from './embedding.ts'

// 4.1 对照实现：同一份语料在 Qdrant 里的建集合、写入、过滤检索。
// 依赖：bun install && docker compose -f docker-compose.kb.yml up -d qdrant

const COLLECTION = 'kb_chunks'
const client = new QdrantClient({
  url: process.env.QDRANT_URL ?? 'http://localhost:6333'
})

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

interface Payload {
  chunk_id: string
  doc_id: string
  text: string
  visibility: string
}

const readPayload = (payload: unknown): Payload => {
  const record = (payload ?? {}) as Record<string, unknown>
  return {
    chunk_id: String(record.chunk_id ?? ''),
    doc_id: String(record.doc_id ?? ''),
    text: String(record.text ?? ''),
    visibility: String(record.visibility ?? '')
  }
}

const main = async (): Promise<void> => {
  const { collections } = await client.getCollections()
  if (collections.some((item) => item.name === COLLECTION)) {
    await client.deleteCollection(COLLECTION)
  }

  await client.createCollection(COLLECTION, {
    vectors: { size: EMBEDDING_DIM, distance: 'Cosine' }
  })

  // payload 上的过滤字段要建索引，否则过滤会退化为逐点判断
  await client.createPayloadIndex(COLLECTION, {
    field_name: 'visibility',
    field_schema: 'keyword'
  })

  // v1.20 起全文索引可直接按 BM25 打分（scoring: true），无需自算稀疏向量；
  // 中文没有空格，必须用 multilingual 分词器，否则整段文本被当成一个 token
  await client.createPayloadIndex(COLLECTION, {
    field_name: 'text',
    field_schema: { type: 'text', tokenizer: 'multilingual', scoring: true }
  })

  const chunks = await loadChunks()
  await client.upsert(COLLECTION, {
    wait: true,
    points: chunks.map((chunk, index) => ({
      id: index + 1,
      vector: embedChunk(chunk.title, chunk.text),
      payload: {
        chunk_id: chunk.id,
        doc_id: chunk.docId,
        text: chunk.text,
        visibility: chunk.visibility
      } satisfies Payload
    }))
  })

  const info = await client.getCollection(COLLECTION)
  const pointsCount = Number(info.points_count ?? 0)
  console.log(`写入 ${pointsCount} 条到 Qdrant`)
  assert(pointsCount === chunks.length, '写入条数与语料块数一致')

  // v1.10+ 统一用 query；旧的 search 方法已并入 query
  const hits = await client.query(COLLECTION, {
    query: embed('退款申请怎么提交'),
    limit: 3,
    with_payload: true
  })

  const top = hits.points[0] ? readPayload(hits.points[0].payload) : undefined
  console.log('\n[qdrang query] 退款申请怎么提交 →')
  console.table(
    hits.points.map((point) => {
      const payload = readPayload(point.payload)
      return { id: payload.chunk_id, doc: payload.doc_id, score: point.score }
    })
  )
  assert(top?.doc_id === '01-退款政策', 'query top1 命中《退款政策》')

  // BM25：query 传文本对象，using 指向建了全文索引的 payload 字段
  const bm25 = await client.query(COLLECTION, {
    query: { text: '增值税专用发票' },
    using: 'text',
    limit: 3,
    with_payload: true
  })
  console.log('\n[qdrang bm25] 增值税专用发票 →')
  console.table(
    bm25.points.map((point) => {
      const payload = readPayload(point.payload)
      return { id: payload.chunk_id, doc: payload.doc_id, score: point.score }
    })
  )
  assert(
    readPayload(bm25.points[0]?.payload).doc_id === '02-发票与对公转账',
    'BM25 top1 命中《发票与对公转账》'
  )

  const filtered = await client.query(COLLECTION, {
    query: embed('备份恢复流程'),
    limit: 10,
    with_payload: true,
    filter: {
      must: [{ key: 'visibility', match: { value: 'public' } }]
    }
  })

  const visibleOnly = filtered.points.every(
    (point) => readPayload(point.payload).visibility === 'public'
  )
  console.log('\n[qdrang filter] visibility == public 下检索「备份恢复流程」→')
  console.table(
    filtered.points.map((point) => {
      const payload = readPayload(point.payload)
      return { doc: payload.doc_id, vis: payload.visibility }
    })
  )
  assert(visibleOnly, 'payload filter 生效：internal 文档不返回')
}

await main()
