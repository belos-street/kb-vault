import {
  DataType,
  FunctionType,
  MetricType,
  MilvusClient
} from '@zilliz/milvus2-sdk-node'
import { loadChunks } from './corpus.ts'
import { EMBEDDING_DIM, embed, embedChunk } from './embedding.ts'

// 4.1 主示例：建集合（稠密 + BM25 稀疏）、写数据、建索引、三路检索、权限过滤。
// 依赖：bun install && docker compose -f docker-compose.kb.yml up -d milvus-standalone

const COLLECTION = 'kb_chunks'
const client = new MilvusClient({
  address: process.env.MILVUS_ADDRESS ?? 'localhost:19530'
})

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

// SDK 的 results 类型是「一维/二维」的联合（由 nq 决定），这里统一收敛成命中数组
interface Hit {
  id: string
  score: number
  doc_id?: string
  visibility?: string
  text?: string
}

const toHits = (results: unknown): Hit[] => {
  if (!Array.isArray(results)) return []
  const first: unknown = results[0]
  if (Array.isArray(first)) return first as Hit[]
  return results as Hit[]
}

// ---------------------------------------------------------------- 建集合
const createCollection = async (): Promise<void> => {
  const exists = await client.hasCollection({ collection_name: COLLECTION })
  if (exists.value) {
    // 教学脚本每次重建；生产禁止这样删库
    await client.dropCollection({ collection_name: COLLECTION })
  }

  await client.createCollection({
    collection_name: COLLECTION,
    description: '知识库分块（dense + BM25 sparse）',
    fields: [
      {
        name: 'id',
        data_type: DataType.VarChar,
        is_primary_key: true,
        type_params: { max_length: '128' }
      },
      {
        name: 'text',
        data_type: DataType.VarChar,
        // enable_analyzer 让 Milvus 在写入时对 text 分词，供 BM25 函数消费
        type_params: {
          max_length: '8192',
          enable_analyzer: 'true',
          analyzer_params: JSON.stringify({ type: 'chinese' })
        }
      },
      {
        name: 'title',
        data_type: DataType.VarChar,
        type_params: { max_length: '256' }
      },
      {
        name: 'doc_id',
        data_type: DataType.VarChar,
        type_params: { max_length: '128' }
      },
      {
        name: 'visibility',
        data_type: DataType.VarChar,
        type_params: { max_length: '16' }
      },
      {
        name: 'dense',
        data_type: DataType.FloatVector,
        type_params: { dim: String(EMBEDDING_DIM) }
      },
      // 稀疏向量由 BM25 函数写入，插入时不需要（也不能）手动赋值
      { name: 'sparse', data_type: DataType.SparseFloatVector }
    ],
    functions: [
      {
        name: 'bm25_text',
        type: FunctionType.BM25,
        input_field_names: ['text'],
        output_field_names: ['sparse'],
        params: {}
      }
    ]
  })

  await client.createIndex([
    {
      collection_name: COLLECTION,
      field_name: 'dense',
      index_type: 'AUTOINDEX',
      metric_type: MetricType.COSINE
    },
    {
      collection_name: COLLECTION,
      field_name: 'sparse',
      index_type: 'SPARSE_INVERTED_INDEX',
      metric_type: 'BM25'
    }
  ])

  // 标量字段也要建索引，filter 才走得动
  await client.createIndex({
    collection_name: COLLECTION,
    field_name: 'visibility',
    index_type: 'INVERTED'
  })

  // 索引建完必须 load 才能搜（load 把段加载进查询节点的内存）
  await client.loadCollectionSync({ collection_name: COLLECTION })
  console.log(`集合 ${COLLECTION} 已创建并加载`)
}

// ---------------------------------------------------------------- 写数据
const ingest = async (): Promise<void> => {
  const chunks = await loadChunks()
  const rows = chunks.map((chunk) => ({
    id: chunk.id,
    text: chunk.text,
    title: chunk.title,
    doc_id: chunk.docId,
    visibility: chunk.visibility,
    dense: embedChunk(chunk.title, chunk.text)
  }))

  await client.insert({ collection_name: COLLECTION, data: rows })
  // 强一致读：教学脚本要断言刚写入的数据，避免 growing segment 未可见
  const count = await client.query({
    collection_name: COLLECTION,
    filter: 'id != ""',
    output_fields: ['count(*)']
  })
  const total = Number(count.data[0]?.['count(*)'] ?? 0)
  console.log(`写入 ${rows.length} 条，集合内共 ${total} 条`)
  assert(total === rows.length, '写入条数与语料块数一致')
}

// ---------------------------------------------------------------- 三种检索
const searchDense = async (query: string, limit = 3): Promise<Hit[]> => {
  const res = await client.search({
    collection_name: COLLECTION,
    data: [embed(query)],
    anns_field: 'dense',
    limit,
    output_fields: ['id', 'doc_id', 'text', 'visibility']
  })
  return toHits(res.results)
}

const searchSparse = async (query: string, limit = 3): Promise<Hit[]> => {
  // data 传字符串：Milvus 用集合上的 BM25 函数把文本转成稀疏向量
  const res = await client.search({
    collection_name: COLLECTION,
    data: [query],
    anns_field: 'sparse',
    limit,
    output_fields: ['id', 'doc_id', 'text', 'visibility']
  })
  return toHits(res.results)
}

const searchHybrid = async (query: string, limit = 3): Promise<Hit[]> => {
  const res = await client.hybridSearch({
    collection_name: COLLECTION,
    data: [
      { anns_field: 'dense', data: embed(query) },
      { anns_field: 'sparse', data: query }
    ],
    rerank: { strategy: 'rrf', params: { k: 60 } },
    limit,
    output_fields: ['id', 'doc_id', 'text', 'visibility']
  })
  return toHits(res.results)
}

// ---------------------------------------------------------------- 主流程
const main = async (): Promise<void> => {
  await createCollection()
  await ingest()

  const denseHits = await searchDense('退款申请怎么提交')
  console.log('\n[dense] 退款申请怎么提交 →')
  console.table(
    denseHits.map((hit) => ({ id: hit.id, doc: hit.doc_id, score: hit.score }))
  )
  assert(
    denseHits[0]?.doc_id === '01-退款政策',
    'dense 检索 top1 命中《退款政策》'
  )

  const sparseHits = await searchSparse('增值税专用发票')
  console.log('\n[bm25] 增值税专用发票 →')
  console.table(
    sparseHits.map((hit) => ({ id: hit.id, doc: hit.doc_id, score: hit.score }))
  )
  assert(
    sparseHits[0]?.doc_id === '02-发票与对公转账',
    'BM25 检索 top1 命中《发票与对公转账》'
  )

  const hybridHits = await searchHybrid('发票红冲')
  console.log('\n[hybrid+RRF] 发票红冲 →')
  console.table(
    hybridHits.map((hit) => ({ id: hit.id, doc: hit.doc_id, score: hit.score }))
  )
  const scores = hybridHits.map((hit) => hit.score)
  assert(
    scores.every((score, i) => i === 0 || (scores[i - 1] ?? 0) >= score),
    'hybrid 结果按 RRF 融合分数降序'
  )
  assert(
    hybridHits.some((hit) => hit.doc_id === '02-发票与对公转账'),
    'hybrid 结果包含发票文档'
  )

  // 权限过滤必须下推到 expr，而不是检索后在应用层裁剪。
  // 先做对照：不带过滤时 internal 文档确实会被召回，否则「过滤生效」无从证明。
  const dueQuery = '成员离职笔记怎么交接'
  const unfiltered = await client.search({
    collection_name: COLLECTION,
    data: [embed(dueQuery)],
    anns_field: 'dense',
    limit: 5,
    output_fields: ['id', 'doc_id', 'visibility']
  })
  const unfilteredHits = toHits(unfiltered.results)
  console.log(`\n[对照] 不带过滤检索「${dueQuery}」→`)
  console.table(
    unfilteredHits.map((hit) => ({ doc: hit.doc_id, vis: hit.visibility }))
  )
  assert(
    unfilteredHits.some((hit) => hit.visibility === 'internal'),
    '对照成立：不带过滤时 internal 文档可被召回'
  )

  const filtered = await client.search({
    collection_name: COLLECTION,
    data: [embed(dueQuery)],
    anns_field: 'dense',
    expr: 'visibility == "public"',
    limit: 5,
    output_fields: ['id', 'doc_id', 'visibility']
  })
  const filteredHits = toHits(filtered.results)
  console.log(`\n[filter] visibility == public 下检索「${dueQuery}」→`)
  console.table(
    filteredHits.map((hit) => ({ doc: hit.doc_id, vis: hit.visibility }))
  )
  assert(
    filteredHits.every((hit) => hit.visibility === 'public') &&
      !filteredHits.some((hit) => hit.doc_id === '04-团队与权限'),
    '过滤生效：internal 文档被排除'
  )
}

await main()
