import type { Block } from '../data/types.ts'

export const lesson31: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**检索闭环**。不装 Docker、不装数据库，只用一个 Embedding API Key，把「文档 → 向量 → 相似度 → top-k → 带引用的检索结果」跑通（生成留到 3.3 / 项目 03）。先把检索手感建立起来，再谈向量库。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: 'Embedding 是什么',
    text: 'Embedding 是把一段文本映射成一个定长向量。语义相近的文本，向量方向更接近。维度由模型决定（常见 768 / 1024 / 1536），本讲不推导模型，只把它当成一个「把文本变成坐标」的函数。'
  },
  { kind: 'h2', text: '先看闭环：chunk → embed → cosine → top-k' },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**chunk**：把文档切成可检索的小块，每块带一个 id。',
      '**embed**：把每个 chunk 和 query 分别变成向量。',
      '**cosine**：算 query 向量与每个 chunk 向量的相似度。',
      '**top-k**：取分数最高的 k 个 chunk，作为回答依据。',
      '**answer**：把 top-k 拼进上下文，要求模型带引用回答；本篇只做检索拼接，生成留到 3.3 / 项目 03；分数不够就拒答。'
    ]
  },
  {
    kind: 'p',
    text: '为什么需要向量检索？关键词检索只会匹配字面，用户问「退款多久到账」时，文档里写的是「3-5 个工作日原路退回」，没有「到账」两个字也能被语义检索命中。向量检索解决的是「说法不同、意思相同」。'
  },
  { kind: 'h2', text: '50 行内存检索' },
  {
    kind: 'code',
    title: 'retrieve.ts',
    lang: 'ts',
    code: String.raw`// 50 行内存检索：零中间件，只需要一个 Embedding Key
type Chunk = { id: string; text: string; vector: number[] }

const docs = [
  { id: 'c1', text: '退款政策：签收后 7 天内可申请无理由退款，3-5 个工作日到账。' },
  { id: 'c2', text: '发票与对公转账：发票抬头需与合同主体一致，1-3 个工作日到账。' },
  { id: 'c3', text: '团队与权限：管理员可邀请成员，并分配只读 / 编辑 / 管理角色。' }
]

const apiKey = process.env.EMBEDDING_API_KEY
const baseUrl = process.env.EMBEDDING_BASE_URL ?? 'https://api.openai.com/v1'
const model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'

if (!apiKey) throw new Error('缺少 EMBEDDING_API_KEY')

async function embed(text: string): Promise<number[]> {
  const response = await fetch(baseUrl + '/embeddings', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify({ model, input: text })
  })
  if (!response.ok) throw new Error('embedding failed: ' + response.status)
  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>
  }
  return data.data[0]?.embedding ?? []
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb)
}

const chunks: Chunk[] = []
for (const doc of docs) {
  chunks.push({ ...doc, vector: await embed(doc.text) })
}

const query = process.argv[2] ?? '退款多久到账？'
const threshold = Number(process.argv[3] ?? '0.35')
const queryVector = await embed(query)
const ranked = chunks
  .map((chunk) => ({ ...chunk, score: cosine(queryVector, chunk.vector) }))
  .sort((a, b) => b.score - a.score)

const top = ranked.slice(0, 3)
const best = top[0]

console.log('query: ' + query)
for (const item of top) {
  console.log(item.score.toFixed(3) + '  [' + item.id + '] ' + item.text)
}

if (!best || best.score < threshold) {
  console.log('拒答：没有足够依据')
} else {
  console.log('回答：根据 [' + best.id + ']，' + best.text)
}`,
    caption:
      '核心闭环约 50 行；真实项目再加批量 embedding、缓存、重试与向量库。`0.35` 只是示例阈值，`text-embedding-3-small` 只是示例模型。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '本篇只做检索，不做生成',
    text: '代码最后只是把 best.text 拼成模板，没有调用 LLM。生成阶段、引用格式与拒答话术留到 3.3 / 项目 03；本篇的目标是把「检索」这条链路单独跑通、单独验证。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`EMBEDDING_API_KEY` 已设置；`EMBEDDING_BASE_URL` / `EMBEDDING_MODEL` 与服务商一致',
      '`bun run retrieve.ts 退款多久到账？` 能打印 3 条候选与分数',
      '`bun run retrieve.ts 今天天气怎么样？` 的最高分显著低于相关 query；把阈值调高后能触发拒答'
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '逐条 embed 只适合学习',
    text: '真实项目要批量 embedding、缓存、失败重试与增量更新。逐条调用在 3 条文档时没问题，到 1000 条就会又慢又贵。这个差距由阶段六的入库流水线补齐。'
  },
  { kind: 'h2', text: '切分：chunk 是检索的最小单位' },
  {
    kind: 'p',
    text: 'chunk 太大，一块里混多个主题，相似度被稀释；chunk 太小，语义不完整，模型拿到半句话。overlap 负责把跨块的句子接起来，但太大会让索引膨胀、召回重复。'
  },
  { kind: 'demo', id: 'chunk-lab' },
  {
    kind: 'table',
    head: ['症状', '可能原因', '先改什么'],
    rows: [
      ['答案被切成两半', 'chunk 太小 / overlap 太小', '增大 chunk 或 overlap'],
      ['一块里混多个主题', 'chunk 太大', '按标题 / 段落切，再控制长度'],
      ['召回结果大量重复', 'overlap 太大', '降低 overlap，或按内容去重'],
      ['表格 / 代码被切断', '按字符硬切', '按结构切，表格单独成块']
    ]
  },
  { kind: 'h2', text: '相似度：cosine、dot 与归一化' },
  {
    kind: 'p',
    text: 'cosine 只看方向，不看长度；dot 同时受方向和长度影响。很多向量库默认用 inner product，如果向量没归一化，分数会被长度带偏。工程上最稳的做法是：写入前统一归一化，查询向量也归一化，这样 dot 与 cosine 等价。'
  },
  { kind: 'demo', id: 'retrieval-pipeline' },
  {
    kind: 'table',
    head: ['指标', '公式直觉', '什么时候用'],
    rows: [
      ['cosine', '点积除以两个向量长度', '文本语义相似度，最常用'],
      ['dot', '直接点积', '向量已归一化，或长度本身有信息'],
      ['L2', '欧氏距离', '图像 / 坐标类特征，文本少用'],
      ['归一化 + dot', '先除以长度，再点积', '向量库只支持 inner product 时']
    ]
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '为什么很多示例先归一化',
    text: '归一化后，向量长度都是 1，dot 就等于 cosine。这样无论向量库默认用哪种距离，排序结果都一致。代价是多一次遍历，但换来的是可复现。'
  },
  { kind: 'h2', text: 'top-k、阈值与拒答' },
  {
    kind: 'p',
    text: 'top-k 不是越大越好。k 越大，召回率上升，但噪声、上下文成本和「模型被无关片段带偏」的概率也上升。阈值负责回答「够不够」，top-k 负责回答「拿几条」。两者要一起调。'
  },
  {
    kind: 'list',
    items: [
      '**k=1**：适合事实型问答，但容易漏掉多跳信息。',
      '**k=3~5**：通用问答的起点，兼顾召回与噪声。',
      '**k=10+**：适合摘要 / 对比，但要先 rerank 或压缩。',
      '**阈值**：先用一小批问题看分数分布，再定；不要拍脑袋写 0.8。'
    ]
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '拒答不是失败，是产品能力',
    text: '没有足够依据时硬答，比拒答更伤用户信任。把「最高分 < 阈值」做成明确分支，并在回答里说明「没有找到足够依据」，比让模型自由发挥更可控。'
  },
  { kind: 'h2', text: '召回差怎么归因' },
  {
    kind: 'table',
    head: ['现象', '先查什么', '常见修复'],
    rows: [
      [
        'top-1 完全不相关',
        'query 与文档是否同一语言 / 领域',
        '换 Embedding、改写 query、补同义词'
      ],
      [
        '答案在 top-5，不在 top-1',
        'chunk 是否太大 / 排序是否够好',
        '加 rerank、缩小 chunk、调 k'
      ],
      ['多个 chunk 内容重复', 'overlap 是否太大', '降低 overlap、按内容去重'],
      [
        '该拒答却回答',
        '阈值是否太低 / 是否要求引用',
        '提高阈值、加引用约束、fail closed'
      ],
      [
        '回答正确但引用错',
        'chunk id 是否稳定 / 拼接是否错位',
        '固定 id、按 id 回填引用'
      ]
    ]
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run retrieve.ts 退款多久到账？` 的 top-1 命中 `c1`',
      '输出包含 chunk id 与分数，回答带 `[c1]` 引用',
      '`bun run retrieve.ts 今天天气怎么样？` 的最高分显著低于相关 query',
      '把阈值调高到接近相关 query 的分数后，同一 query 会走拒答分支'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `retrieve.ts`、一份 3 条文档的小语料、一张召回归因表。下一篇 3.2 会把切分、Embedding 选型与归一化拆开讲，3.3 再用三条断言做最小评估。'
  },
  {
    kind: 'exercise',
    title: '3.1 练习：把检索调准',
    items: [
      {
        id: 's3-1-e1',
        level: '基础',
        question: '把 top-k 从 1 改到 3、5，分别记录 top-1 是否变化。',
        hint: '固定 query 与语料，只改 k；记录 top-1 是否变化、上下文长度怎么变。',
        answer: 'k 变大不一定改变 top-1；它改变的是「给模型的上下文」与噪声。',
        solution:
          '观察排序列表与最终回答。k=5 时如果引入无关 chunk，回答可能变长但不变准，这就是噪声成本。'
      },
      {
        id: 's3-1-e2',
        level: '改造',
        question:
          '现在阈值是固定值。改成按 query 类型自适应：先判断 query 是「事实型 / 对比型 / 闲聊型」，再给不同阈值。',
        hint: '不要引入分类模型；先写一个 3 条规则的关键词判断，再为每类设一个阈值。',
        answer:
          '事实型阈值偏高（宁拒答），对比型偏低（需要多召回），闲聊型直接不检索。',
        solution:
          '示例：命中「多久 / 多少 / 是否」判为事实型，阈值 0.45；命中「对比 / 区别 / 优缺点」判为对比型，阈值 0.3 且 k=5；其余直接拒答或走闲聊。跑一批 query 看误拒和误答哪个更不可接受，再微调。'
      },
      {
        id: 's3-1-e3',
        level: '排障',
        question: '无论问什么，top-1 总是 `c1`。列出三种可能原因。',
        hint: '先打印 query 向量长度与前 5 位，再检查 chunk 向量是否全都一样。',
        answer:
          'query embedding 失败 / 向量未归一化 / 文档向量重复或模型不支持多语言。',
        solution:
          '先打印 query 向量长度与前 5 位；再检查所有 chunk 向量是否相同；最后换一个 Embedding 模型对比。'
      },
      {
        id: 's3-1-e4',
        level: '设计',
        question: '1000 条文档、10 QPS，设计一个不超预算的检索方案。',
        hint: '按「离线 / 在线 / 缓存 / 重排 / 预算」五层写，不要直接写「上 Milvus」。',
        answer:
          '批量 embedding + 缓存 + 向量库 + top-k 后 rerank；query 缓存命中直接返回。',
        solution:
          '离线批量 embed 并持久化；query 侧加 LRU 缓存；向量库选 pgvector / Qdrant；top-20 召回后 rerank 到 top-5；对高频问题缓存最终回答。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'RAG 全链路是什么？',
        '切分 → embedding → 索引 → 召回 → 重排 → 拼上下文 → 带引用生成 → 评估。'
      ],
      [
        'cosine 与 dot 的区别？',
        'cosine 只看方向，dot 受长度影响；向量归一化后两者等价。'
      ],
      [
        '为什么要 chunk？',
        '模型上下文有限，检索需要最小语义单元；chunk 质量直接决定召回质量。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：召回为 0 怎么排障？',
    text: '按顺序查：query 是否为空 / 语言不匹配 → embedding 是否报错或返回空向量 → 文档是否真的入库 → 相似度是否被长度带偏 → 阈值是否过高。每一步都要有日志，不要只看最终回答。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Embeddings',
        href: 'https://platform.openai.com/docs/guides/embeddings',
        note: 'embedding 接口、维度与计费'
      },
      {
        label: 'rag-algorithms：分块与向量表示',
        href: 'https://belos-street.github.io/kb-vault/artificial-intelligence/agent/rag-algorithms/README.html',
        note: '切分、Embedding、ANN 的算法细节'
      }
    ]
  }
]
