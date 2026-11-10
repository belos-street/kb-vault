import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  DataType,
  FunctionType,
  MetricType,
  MilvusClient
} from '@zilliz/milvus2-sdk-node'
import Redis from 'ioredis'
import { Pool } from 'pg'
import { EMBEDDING_DIM, embed, embedChunk } from './embedding.ts'

// 4.5 主示例：上传 → 入队 → 解析切分 → 幂等索引 → 状态机 → 权限过滤检索。
// 依赖：bun install && docker compose -f docker-compose.kb.yml up -d postgres redis milvus-standalone

const COLLECTION = 'kb_ingest'
const QUEUE_KEY = 'kb:ingest'
const MAX_ATTEMPTS = 3
const CHUNK_SIZE = 600

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/kb'
})
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
const milvus = new MilvusClient({
  address: process.env.MILVUS_ADDRESS ?? 'localhost:19530'
})

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

// SDK 返回一维/二维联合类型，统一收敛成行数组
const toRows = (results: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(results)) return []
  const first: unknown = results[0]
  return (Array.isArray(first) ? first : results) as Array<
    Record<string, unknown>
  >
}

const sha256 = (text: string): string =>
  createHash('sha256').update(text).digest('hex')

// ---------------------------------------------------------------- 元数据库
const migrate = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kb_documents (
      id           text PRIMARY KEY,
      title        text NOT NULL,
      tenant_id    text NOT NULL,
      visibility   text NOT NULL,
      checksum     text NOT NULL,
      status       text NOT NULL DEFAULT 'pending',
      attempts     int  NOT NULL DEFAULT 0,
      error        text,
      updated_at   timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kb_document_contents (
      doc_id  text PRIMARY KEY REFERENCES kb_documents(id) ON DELETE CASCADE,
      content text NOT NULL
    )
  `)
}

// ---------------------------------------------------------------- 向量库
const ensureCollection = async (): Promise<void> => {
  const exists = await milvus.hasCollection({ collection_name: COLLECTION })
  if (exists.value) await milvus.dropCollection({ collection_name: COLLECTION })

  await milvus.createCollection({
    collection_name: COLLECTION,
    fields: [
      {
        name: 'id',
        data_type: DataType.VarChar,
        is_primary_key: true,
        type_params: { max_length: '128' }
      },
      {
        name: 'doc_id',
        data_type: DataType.VarChar,
        type_params: { max_length: '128' }
      },
      {
        name: 'title',
        data_type: DataType.VarChar,
        type_params: { max_length: '256' }
      },
      {
        name: 'tenant_id',
        data_type: DataType.VarChar,
        type_params: { max_length: '64' }
      },
      {
        name: 'visibility',
        data_type: DataType.VarChar,
        type_params: { max_length: '16' }
      },
      {
        // Array 字段：element_type + max_capacity + max_length 三个参数缺一不可，
        // 少了 max_length 建集合直接报 "type param(max_length) should be specified"
        name: 'space_ids',
        data_type: DataType.Array,
        element_type: DataType.VarChar,
        type_params: { max_capacity: '16', max_length: '64' }
      },
      {
        name: 'text',
        data_type: DataType.VarChar,
        type_params: {
          max_length: '8192',
          enable_analyzer: 'true',
          analyzer_params: JSON.stringify({ type: 'chinese' })
        }
      },
      {
        name: 'dense',
        data_type: DataType.FloatVector,
        type_params: { dim: String(EMBEDDING_DIM) }
      },
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

  await milvus.createIndex([
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
  await milvus.createIndex([
    {
      collection_name: COLLECTION,
      field_name: 'tenant_id',
      index_type: 'INVERTED'
    },
    {
      collection_name: COLLECTION,
      field_name: 'visibility',
      index_type: 'INVERTED'
    }
  ])
  await milvus.loadCollectionSync({ collection_name: COLLECTION })
}

// ---------------------------------------------------------------- 投递（幂等入口）
interface UploadedDoc {
  id: string
  title: string
  tenantId: string
  visibility: 'public' | 'internal'
  content: string
}

const submit = async (doc: UploadedDoc): Promise<'queued' | 'skipped'> => {
  const checksum = sha256(doc.content)
  const existing = await pool.query<{ checksum: string; status: string }>(
    'SELECT checksum, status FROM kb_documents WHERE id = $1',
    [doc.id]
  )
  const row = existing.rows[0]

  if (row && row.checksum === checksum && row.status === 'indexed') {
    return 'skipped' // 内容未变且已索引：幂等跳过，不重复付费
  }

  await pool.query(
    `INSERT INTO kb_documents (id, title, tenant_id, visibility, checksum, status, attempts, error)
     VALUES ($1, $2, $3, $4, $5, 'pending', 0, NULL)
     ON CONFLICT (id) DO UPDATE
       SET title = $2, tenant_id = $3, visibility = $4, checksum = $5,
           status = 'pending', attempts = 0, error = NULL, updated_at = now()`,
    [doc.id, doc.title, doc.tenantId, doc.visibility, checksum]
  )
  // 正文与状态分开存：向量库只存块，原件/解析结果留在关系库
  await pool.query(
    `INSERT INTO kb_document_contents (doc_id, content) VALUES ($1, $2)
     ON CONFLICT (doc_id) DO UPDATE SET content = $2`,
    [doc.id, doc.content]
  )
  await redis.rpush(QUEUE_KEY, doc.id)
  return 'queued'
}

// ---------------------------------------------------------------- 解析与切分
const splitIntoChunks = (content: string): string[] => {
  const sections = content
    .split(/\n(?=## )/g)
    .map((s) => s.trim())
    .filter(Boolean)
  const chunks: string[] = []
  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      chunks.push(section)
      continue
    }
    const paragraphs = section.split(/\n\n+/g)
    let buffer = ''
    for (const paragraph of paragraphs) {
      if ((buffer + paragraph).length > CHUNK_SIZE && buffer) {
        chunks.push(buffer.trim())
        buffer = ''
      }
      buffer += `${paragraph}\n\n`
    }
    if (buffer.trim()) chunks.push(buffer.trim())
  }
  return chunks
}

// ---------------------------------------------------------------- 处理单个任务
const loadDoc = async (id: string): Promise<UploadedDoc | null> => {
  const result = await pool.query<{
    id: string
    title: string
    tenant_id: string
    visibility: string
    content: string
  }>(
    `SELECT d.id, d.title, d.tenant_id, d.visibility, c.content
       FROM kb_documents d
       LEFT JOIN kb_document_contents c ON c.doc_id = d.id
      WHERE d.id = $1`,
    [id]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    tenantId: row.tenant_id,
    visibility: row.visibility === 'internal' ? 'internal' : 'public',
    content: row.content ?? ''
  }
}

// docId 会拼进过滤表达式，必须校验：只允许字母/数字/汉字与少量安全符号
const SAFE_ID = /^[\p{L}\p{N}_#.-]{1,128}$/u
const assertSafeId = (id: string): string => {
  if (!SAFE_ID.test(id)) throw new Error(`非法 docId：${id}`)
  return id
}

const indexDoc = async (doc: UploadedDoc): Promise<number> => {
  const chunks = splitIntoChunks(doc.content)
  if (chunks.length === 0) throw new Error('空文档：解析后没有任何可索引块')

  // 先删旧块再写新块：文档更新时避免新旧版本共存。
  // ⚠️ 默认 Bounded 一致性下删除有约 1s 可见窗口，强一致需显式设置（见 4.5 正文）
  await milvus.deleteEntities({
    collection_name: COLLECTION,
    expr: `doc_id == "${assertSafeId(doc.id)}"`
  })

  await milvus.insert({
    collection_name: COLLECTION,
    data: chunks.map((text, index) => ({
      id: `${doc.id}#${index}`,
      doc_id: doc.id,
      title: doc.title,
      tenant_id: doc.tenantId,
      visibility: doc.visibility,
      space_ids: doc.id === '04-团队与权限' ? ['space_ops'] : ['space_pay'],
      text,
      dense: embedChunk(doc.title, text)
    }))
  })
  return chunks.length
}

// ---------------------------------------------------------------- Worker
interface WorkerResult {
  indexed: string[]
  skipped: string[]
  dead: string[]
}

const drainQueue = async (): Promise<WorkerResult> => {
  const result: WorkerResult = { indexed: [], skipped: [], dead: [] }

  while (true) {
    const popped = await redis.brpop(QUEUE_KEY, 1)
    if (!popped) break
    const docId = popped[1]
    if (!docId) continue

    const status = await pool.query<{ status: string }>(
      'SELECT status FROM kb_documents WHERE id = $1',
      [docId]
    )
    if (status.rows[0]?.status === 'indexed') {
      result.skipped.push(docId)
      continue
    }

    const doc = await loadDoc(docId)
    if (!doc) continue

    let attempt = 0
    let lastError = ''
    while (attempt < MAX_ATTEMPTS) {
      attempt++
      try {
        await indexDoc(doc)
        await pool.query(
          `UPDATE kb_documents
              SET status = 'indexed', attempts = $2, error = NULL, updated_at = now()
            WHERE id = $1`,
          [docId, attempt]
        )
        result.indexed.push(docId)
        lastError = ''
        break
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.warn(`  ${docId} 第 ${attempt} 次索引失败：${lastError}`)
      }
    }

    if (lastError) {
      await pool.query(
        `UPDATE kb_documents
            SET status = 'dead', attempts = $2, error = $3, updated_at = now()
          WHERE id = $1`,
        [docId, attempt, lastError]
      )
      result.dead.push(docId)
    }
  }

  return result
}

// ---------------------------------------------------------------- 主流程
const loadUploads = async (): Promise<UploadedDoc[]> => {
  const dir = join(import.meta.dir, '../data/docs')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()
  const docs: UploadedDoc[] = []
  for (const file of files) {
    const content = await readFile(join(dir, file), 'utf8')
    const id = file.replace(/\.md$/, '')
    docs.push({
      id,
      title: content.match(/^#\s+(.+)$/m)?.[1] ?? id,
      tenantId: 'acme',
      visibility: content.includes('visibility: internal')
        ? 'internal'
        : 'public',
      content
    })
  }
  return docs
}

const main = async (): Promise<void> => {
  await migrate()
  // 教学脚本每次从干净状态开始；生产禁止清表
  await pool.query('TRUNCATE kb_documents CASCADE')
  await ensureCollection()
  await redis.del(QUEUE_KEY)

  const uploads = await loadUploads()
  const firstPass = await Promise.all(uploads.map((doc) => submit(doc)))
  console.log(
    `首次投递：queued=${firstPass.filter((s) => s === 'queued').length}`
  )
  const run1 = await drainQueue()
  console.log(
    `首轮任务：indexed=${run1.indexed.length}, dead=${run1.dead.length}`
  )
  assert(run1.indexed.length === uploads.length, '首轮全部文档索引成功')

  // 幂等：原样再投一次，应全部 skipped，不触发任何重灌
  const secondPass = await Promise.all(uploads.map((doc) => submit(doc)))
  const run2 = await drainQueue()
  console.log(
    `二次投递：queued=${secondPass.filter((s) => s === 'queued').length}, ` +
      `skipped=${secondPass.filter((s) => s === 'skipped').length}`
  )
  assert(
    secondPass.every((s) => s === 'skipped') && run2.indexed.length === 0,
    '相同 checksum 重投被幂等跳过'
  )

  // 内容变更：只重灌这一篇。故意换成更短的内容（单块），
  // 用来验证「旧块被删除」而不是仅被覆盖——否则旧块会残留可检索
  const changed = {
    ...uploads[0]!,
    content: '# 退款政策（更新）\n\n仅保留这一条说明。'
  }
  await pool.query(
    'UPDATE kb_document_contents SET content = $2 WHERE doc_id = $1',
    [changed.id, changed.content]
  )
  const thirdPass = await submit(changed)
  const run3 = await drainQueue()
  console.log(`变更投递：${thirdPass}, 重灌=${run3.indexed.join(',')}`)
  assert(
    run3.indexed.length === 1 && run3.indexed[0] === changed.id,
    '仅变更文档被重灌'
  )

  // 旧块必须已经不可检索：更新后该文档只剩 1 块
  const afterUpdate = await milvus.query({
    collection_name: COLLECTION,
    filter: `doc_id == "${assertSafeId(changed.id)}"`,
    output_fields: ['id'],
    limit: 100
  })
  const remaining = toRows(afterUpdate.data).map((row) => String(row.id))
  console.log('更新后该文档剩余块：', remaining.join(', '))
  assert(
    remaining.length === 1 && remaining[0] === `${changed.id}#0`,
    '更新后旧块已删除，只剩新写入的 1 块'
  )

  // 故障文档：解析后为空 → 重试 3 次 → dead
  await submit({
    id: '99-空文档',
    title: '空文档',
    tenantId: 'acme',
    visibility: 'public',
    content: '   '
  })
  const run4 = await drainQueue()
  const deadRow = await pool.query<{ status: string; attempts: number }>(
    'SELECT status, attempts FROM kb_documents WHERE id = $1',
    ['99-空文档']
  )
  console.log(
    `故障文档：status=${deadRow.rows[0]?.status}, attempts=${deadRow.rows[0]?.attempts}`
  )
  assert(run4.dead.includes('99-空文档'), '空文档进入 dead 状态')
  assert(
    deadRow.rows[0]?.attempts === MAX_ATTEMPTS,
    `重试次数达到上限 ${MAX_ATTEMPTS}`
  )

  // 权限下推 A：只检索 acme + public
  const publicRes = await milvus.search({
    collection_name: COLLECTION,
    data: [embed('备份恢复流程')],
    anns_field: 'dense',
    expr: 'tenant_id == "acme" and visibility == "public"',
    limit: 5,
    output_fields: ['doc_id', 'tenant_id', 'visibility', 'space_ids']
  })
  const publicHits = toRows(publicRes.results)
  console.log('\n[filter A] acme + public 检索「备份恢复流程」→')
  console.table(
    publicHits.map((hit) => ({
      doc: String(hit.doc_id),
      tenant: String(hit.tenant_id),
      vis: String(hit.visibility)
    }))
  )
  assert(publicHits.length > 0, '过滤检索返回结果')
  assert(
    publicHits.every(
      (hit) => hit.visibility === 'public' && hit.tenant_id === 'acme'
    ),
    '租户与可见性过滤同时生效'
  )

  // 权限下推 B：只有 space_pay 授权 → internal 的《团队与权限》(space_ops) 必须被拒
  const grantedRes = await milvus.search({
    collection_name: COLLECTION,
    data: [embed('成员离职笔记怎么交接')],
    anns_field: 'dense',
    expr:
      'tenant_id == "acme" and ' +
      '(visibility == "public" or ' +
      '(visibility == "internal" and array_contains_any(space_ids, ["space_pay"])))',
    limit: 5,
    output_fields: ['doc_id', 'visibility', 'space_ids']
  })
  const grantedHits = toRows(grantedRes.results)
  console.log('\n[filter B] 仅 space_pay 授权检索「成员离职笔记怎么交接」→')
  console.table(
    grantedHits.map((hit) => ({
      doc: String(hit.doc_id),
      vis: String(hit.visibility),
      spaces: String(hit.space_ids)
    }))
  )
  assert(
    !grantedHits.some(
      (hit) => hit.doc_id === '04-团队与权限' && hit.visibility === 'internal'
    ),
    '空间拒绝分支：无 space_ops 权限时 internal 文档不返回'
  )

  // 权限下推 C：补上 space_ops 后同一篇 internal 文档可见（正向对照）
  const opsRes = await milvus.search({
    collection_name: COLLECTION,
    data: [embed('成员离职笔记怎么交接')],
    anns_field: 'dense',
    expr:
      'tenant_id == "acme" and ' +
      '(visibility == "public" or ' +
      '(visibility == "internal" and array_contains_any(space_ids, ["space_ops"])))',
    limit: 5,
    output_fields: ['doc_id', 'visibility', 'space_ids']
  })
  const opsHits = toRows(opsRes.results)
  console.log('\n[filter C] 追加 space_ops 授权后同一查询 →')
  console.table(
    opsHits.map((hit) => ({
      doc: String(hit.doc_id),
      vis: String(hit.visibility),
      spaces: String(hit.space_ids)
    }))
  )
  assert(
    opsHits.some(
      (hit) => hit.doc_id === '04-团队与权限' && hit.visibility === 'internal'
    ),
    '空间允许分支：有 space_ops 权限时 internal 文档可见'
  )

  await milvus.closeConnection()
  await redis.quit()
  await pool.end()
}

await main()
