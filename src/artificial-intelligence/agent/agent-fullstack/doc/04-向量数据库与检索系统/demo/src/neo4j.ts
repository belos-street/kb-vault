import neo4j from 'neo4j-driver'
import { loadChunks } from './corpus.ts'
import { EMBEDDING_DIM, embed, embedChunk } from './embedding.ts'

// 4.4 主示例：文档 → 块 → 实体的图建模、向量索引、多跳扩展检索。
// 依赖：bun install && docker compose -f docker-compose.kb.yml up -d neo4j

const URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
const USER = process.env.NEO4J_USER ?? 'neo4j'
const PASSWORD = process.env.NEO4J_PASSWORD ?? 'kbpassword'

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

// 实体抽取的「规则替身」：生产用 LLM + 结构化输出（见 4.4 正文 4.2）
const ENTITY_DICT = [
  '退款',
  '发票',
  '红冲',
  '对公转账',
  '两步验证',
  '审计日志',
  '备份',
  '回收站',
  '限流',
  'Webhook'
]

const extractEntities = (text: string): string[] =>
  ENTITY_DICT.filter((entity) => text.includes(entity))

interface ChunkRow {
  id: string
  docId: string
  title: string
  tenantId: string
  visibility: string
  text: string
  entities: string[]
}

const resetGraph = async (): Promise<void> => {
  await driver.executeQuery(
    'MATCH (n) DETACH DELETE n',
    {},
    {
      database: 'neo4j'
    }
  )
  await driver.executeQuery(
    'CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE',
    {},
    { database: 'neo4j' }
  )
  await driver.executeQuery(
    'CREATE CONSTRAINT doc_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE',
    {},
    { database: 'neo4j' }
  )
  await driver.executeQuery(
    'CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE',
    {},
    { database: 'neo4j' }
  )
  // 向量索引：维度必须与 embedding 一致，相似度函数与 Milvus/ES 保持 cosine
  await driver.executeQuery(
    `CREATE VECTOR INDEX chunk_embedding IF NOT EXISTS
     FOR (c:Chunk) ON (c.embedding)
     OPTIONS {indexConfig: {\`vector.dimensions\`: ${EMBEDDING_DIM},
                            \`vector.similarity_function\`: 'cosine'}}`,
    {},
    { database: 'neo4j' }
  )
}

const insertGraph = async (rows: ChunkRow[]): Promise<void> => {
  await driver.executeQuery(
    `UNWIND $rows AS row
     MERGE (d:Document {id: row.docId})
       SET d.title = row.title
     MERGE (c:Chunk {id: row.id})
       SET c.text = row.text, c.docId = row.docId, c.title = row.title,
           c.tenantId = row.tenantId, c.visibility = row.visibility,
           c.embedding = row.embedding
     MERGE (d)-[:HAS_CHUNK]->(c)
     WITH row, c
     UNWIND row.entities AS name
     MERGE (e:Entity {name: name})
     MERGE (c)-[:MENTIONS]->(e)`,
    {
      rows: rows.map((row) => ({
        id: row.id,
        docId: row.docId,
        title: row.title,
        tenantId: row.tenantId,
        visibility: row.visibility,
        text: row.text,
        entities: row.entities,
        embedding: embedChunk(row.title, row.text)
      }))
    },
    { database: 'neo4j' }
  )
}

const vectorSearch = async (query: string, limit = 3) => {
  const result = await driver.executeQuery(
    `CALL db.index.vector.queryNodes('chunk_embedding', $k, $embedding)
     YIELD node, score
     RETURN node.id AS id, node.docId AS docId, score
     ORDER BY score DESC`,
    { k: neo4j.int(limit), embedding: embed(query) },
    { database: 'neo4j' }
  )
  return result.records.map((record) => ({
    id: String(record.get('id')),
    docId: String(record.get('docId')),
    score: Number(record.get('score'))
  }))
}

// 图扩展：从命中块出发，沿共享实体找到「另一篇文档」的关联块
const expandByEntity = async (chunkId: string, limit = 5) => {
  const result = await driver.executeQuery(
    `MATCH (c:Chunk {id: $chunkId})-[:MENTIONS]->(e:Entity)<-[:MENTIONS]-(other:Chunk)
     WHERE other.id <> c.id
     RETURN other.id AS id, other.docId AS docId, e.name AS via
     LIMIT $limit`,
    { chunkId, limit: neo4j.int(limit) },
    { database: 'neo4j' }
  )
  return result.records.map((record) => ({
    id: String(record.get('id')),
    docId: String(record.get('docId')),
    via: String(record.get('via'))
  }))
}

// 两跳：由实体反查它连接了哪些文档
const entityNeighbors = async (entity: string) => {
  const result = await driver.executeQuery(
    `MATCH (e:Entity {name: $entity})<-[:MENTIONS]-(c:Chunk)<-[:HAS_CHUNK]-(d:Document)
     RETURN DISTINCT d.id AS docId`,
    { entity },
    { database: 'neo4j' }
  )
  return result.records.map((record) => String(record.get('docId')))
}

// 向量索引是异步填充的：建完立刻查可能拿到 0 条，必须等状态变 ONLINE
const waitForVectorIndex = async (): Promise<void> => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await driver.executeQuery(
      `SHOW INDEXES YIELD name, state WHERE name = 'chunk_embedding' RETURN state`,
      {},
      { database: 'neo4j' }
    )
    if (String(res.records[0]?.get('state')) === 'ONLINE') return
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('向量索引未在 6 秒内变为 ONLINE')
}

const main = async (): Promise<void> => {
  await resetGraph()

  const chunks = await loadChunks()
  const rows: ChunkRow[] = chunks.map((chunk) => ({
    id: chunk.id,
    docId: chunk.docId,
    title: chunk.title,
    tenantId: chunk.tenantId,
    visibility: chunk.visibility,
    text: chunk.text,
    entities: extractEntities(chunk.text)
  }))
  await insertGraph(rows)

  const counts = await driver.executeQuery(
    `MATCH (c:Chunk) WITH count(c) AS chunks
     MATCH (e:Entity) RETURN chunks, count(e) AS entities`,
    {},
    { database: 'neo4j' }
  )
  const chunksCount = Number(counts.records[0]?.get('chunks') ?? 0)
  const entityCount = Number(counts.records[0]?.get('entities') ?? 0)
  console.log(`图中共 ${chunksCount} 个块、${entityCount} 个实体`)
  assert(chunksCount === rows.length, '块节点数与语料一致')
  assert(entityCount > 0, '实体节点非空')

  // 三存储契约：Chunk 节点必须带租户与可见性，否则图扩展无法做权限过滤
  const props = await driver.executeQuery(
    `MATCH (c:Chunk {id: '01-退款政策#0'})
     RETURN c.title AS title, c.tenantId AS tenantId, c.visibility AS visibility`,
    {},
    { database: 'neo4j' }
  )
  const propRow = props.records[0]
  console.log(
    'Chunk 属性：',
    JSON.stringify({
      title: propRow?.get('title'),
      tenantId: propRow?.get('tenantId'),
      visibility: propRow?.get('visibility')
    })
  )
  assert(String(propRow?.get('tenantId')) === 'acme', 'Chunk 节点带 tenantId')
  assert(
    String(propRow?.get('visibility')) === 'public',
    'Chunk 节点带 visibility'
  )

  // 等索引上线：轮询 SHOW INDEXES 直到 ONLINE
  await waitForVectorIndex()

  const hits = await vectorSearch('退款申请怎么提交', 3)
  console.log('\n[vector] 退款申请怎么提交 →')
  console.table(hits)
  assert(hits[0]?.docId === '01-退款政策', '向量检索 top1 命中《退款政策》')

  const target = hits[0]?.id ?? ''
  const expanded = await expandByEntity(target, 5)
  console.log(`\n[graph expand] 命中块 ${target} 的实体邻居 →`)
  console.table(expanded)
  assert(expanded.length > 0, '图扩展返回关联块')

  const docs = await entityNeighbors('发票')
  console.log('\n[2-hop] 实体「发票」关联的文档 →', docs.join(', '))
  assert(docs.includes('02-发票与对公转账'), '实体反查命中《发票与对公转账》')
  assert(
    docs.some((doc) => doc !== '02-发票与对公转账'),
    '实体「发票」跨文档关联到其他文档'
  )

  await driver.close()
}

await main()
