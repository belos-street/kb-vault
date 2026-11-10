import { Client } from '@elastic/elasticsearch'
import { HttpConnection } from '@elastic/transport'
import { loadChunks } from './corpus.ts'
import { EMBEDDING_DIM, embed, embedChunk } from './embedding.ts'

// 4.2 主示例：映射设计、bulk 写入、BM25、kNN、RRF 混合检索、聚合。
// 依赖：bun install && docker compose -f docker-compose.kb.yml up -d elasticsearch

const INDEX = 'kb_chunks'
// Bun 下客户端默认的 Undici 连接器不可用（response.headers undefined），
// 显式换回基于 node:http 的 HttpConnection；Node 环境可省略这一行。
const es = new Client({
  node: process.env.ES_NODE ?? 'http://localhost:9200',
  Connection: HttpConnection
})

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

interface Source {
  chunk_id: string
  doc_id: string
  tenant_id: string
  title: string
  visibility: string
  text: string
}

const createIndex = async (): Promise<void> => {
  const exists = await es.indices.exists({ index: INDEX })
  if (exists) await es.indices.delete({ index: INDEX })

  await es.indices.create({
    index: INDEX,
    mappings: {
      // 生产建议 dynamic: 'strict'；这里保留默认是为了让示例字段演进时不报错
      properties: {
        chunk_id: { type: 'keyword' },
        doc_id: { type: 'keyword' },
        // 与 Milvus / Neo4j 共用的过滤维度，三存储保持一致
        tenant_id: { type: 'keyword' },
        // 同一字段既要全文检索（text）又要精确聚合/过滤（keyword）
        title: {
          type: 'text',
          fields: { keyword: { type: 'keyword', ignore_above: 256 } }
        },
        visibility: { type: 'keyword' },
        text: { type: 'text' },
        dense: {
          type: 'dense_vector',
          dims: EMBEDDING_DIM,
          index: true,
          similarity: 'cosine'
        }
      }
    }
  })
}

const bulkIndex = async (): Promise<number> => {
  const chunks = await loadChunks()
  const operations = chunks.flatMap((chunk) => [
    { index: { _index: INDEX, _id: chunk.id } },
    {
      chunk_id: chunk.id,
      doc_id: chunk.docId,
      tenant_id: chunk.tenantId,
      title: chunk.title,
      visibility: chunk.visibility,
      text: chunk.text,
      dense: embedChunk(chunk.title, chunk.text)
    }
  ])

  const res = await es.bulk({ refresh: true, operations })
  if (res.errors) {
    const failed = res.items.find((item) => item.index?.error)
    throw new Error(`bulk 部分失败：${JSON.stringify(failed?.index?.error)}`)
  }
  console.log(`bulk 写入 ${chunks.length} 条`)
  return chunks.length
}

const main = async (): Promise<void> => {
  await createIndex()
  const total = await bulkIndex()
  assert(total > 0, 'bulk 写入成功且无 errors')

  // ① BM25 全文检索
  const bm25 = await es.search<Source>({
    index: INDEX,
    query: { match: { text: '增值税专用发票' } },
    size: 3,
    _source: ['doc_id', 'text']
  })
  console.log('\n[bm25] 增值税专用发票 →')
  console.table(
    bm25.hits.hits.map((hit) => ({
      id: hit._id,
      doc: hit._source?.doc_id,
      score: hit._score
    }))
  )
  assert(
    bm25.hits.hits[0]?._source?.doc_id === '02-发票与对公转账',
    'BM25 top1 命中《发票与对公转账》'
  )

  // ② kNN 向量检索（v9 起旧的 _knn_search API 已移除，统一走 _search 的 knn）
  const knn = await es.search<Source>({
    index: INDEX,
    knn: {
      field: 'dense',
      query_vector: embed('退款申请怎么提交'),
      k: 3,
      num_candidates: 50
    },
    size: 3,
    _source: ['doc_id']
  })
  console.log('\n[knn] 退款申请怎么提交 →')
  console.table(
    knn.hits.hits.map((hit) => ({
      id: hit._id,
      doc: hit._source?.doc_id,
      score: hit._score
    }))
  )
  assert(
    knn.hits.hits[0]?._source?.doc_id === '01-退款政策',
    'kNN top1 命中《退款政策》'
  )

  // ③ RRF 混合检索：standard（BM25）+ knn 两路，服务端融合
  const hybrid = await es.search<Source>({
    index: INDEX,
    retriever: {
      rrf: {
        retrievers: [
          { standard: { query: { match: { text: '发票红冲' } } } },
          {
            knn: {
              field: 'dense',
              query_vector: embed('发票红冲'),
              k: 10,
              num_candidates: 50
            }
          }
        ],
        rank_constant: 60,
        // 必须 >= size；不写默认 10，size 大于 10 时会 400
        rank_window_size: 50
      }
    },
    size: 3,
    _source: ['doc_id']
  })
  console.log('\n[rrf] 发票红冲 →')
  console.table(
    hybrid.hits.hits.map((hit) => ({
      id: hit._id,
      doc: hit._source?.doc_id,
      score: hit._score
    }))
  )
  assert(hybrid.hits.hits.length > 0, 'RRF 混合检索返回结果')
  assert(
    hybrid.hits.hits[0]?._source?.doc_id === '02-发票与对公转账',
    'RRF top1 命中《发票与对公转账》'
  )

  // ④ 聚合：按文档统计块数（知识库治理常用）
  const agg = await es.search({
    index: INDEX,
    size: 0,
    aggs: {
      by_doc: {
        terms: { field: 'doc_id', size: 10 },
        aggs: { chunks: { value_count: { field: 'chunk_id' } } }
      }
    }
  })
  const buckets = agg.aggregations?.by_doc as
    | { buckets: Array<{ key: string; doc_count: number }> }
    | undefined
  console.log('\n[aggs] 各文档块数 →')
  console.table(
    buckets?.buckets.map((bucket) => ({
      doc: bucket.key,
      chunks: bucket.doc_count
    }))
  )
  const sum = buckets?.buckets.reduce((acc, b) => acc + b.doc_count, 0) ?? 0
  assert(sum === total, '聚合块数总和等于写入总数')
}

await main()
