import type { Block } from '../data/types.ts'

export const lesson32: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**切分与向量质量**。3.1 用 5 条手写短文档跑通了闭环，真实文档却是长文、有标题、有表格、还有代码。检索不准时，先别怀疑模型：多数问题出在切分把答案切断了，或向量这一层根本没对齐。本篇仍然不引入向量库。'
  },
  {
    kind: 'note',
    tone: 'definition',
    title: '切分决定召回上限',
    text: '切分把答案切成两半，再强的 Embedding 也救不回来；切分把多个主题揉进一块，相似度会被稀释。Embedding 与归一化决定「换个说法能不能对上」，切分决定「对不对得上还有没有机会」。'
  },
  { kind: 'h2', text: '切分：先按结构，再按长度' },
  {
    kind: 'p',
    text: '切分有优先级：标题层级 > 段落 > 句子 > 定长兜底。结构切分保留语义边界，长度只用来兜底超长段落。很多团队一上来就按 512 字符硬切，结果代码和表格被拦腰截断，后面换什么模型都救不回来。'
  },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**按标题切**：二级标题下的内容自成一个主题，FAQ、条款、产品文档天然适配。',
      '**按段落切**：段落是天然语义单元；相邻短段合并到目标长度，避免碎成一句一块。',
      '**按句末标点兜底**：单段超长时按长度累加，切点优先落在句号、分号、换行上。',
      '**定长兜底**：表格、代码、无标点文本按长度硬切，并单独成块，不与正文混排。',
      '**overlap 只加在硬切处**：结构切分不需要 overlap；硬切处保留尾部一小段，防止边界句丢失。'
    ]
  },
  {
    kind: 'code',
    title: 'split.ts：结构切分 + 长度兜底',
    lang: 'ts',
    code: String.raw`type Chunk = { id: string; heading: string; text: string }

const HEADING = /^(#{1,6})\s+(.+)$/

// 超长段落按长度硬切，切点优先落在句号 / 分号 / 换行
function splitLong(text: string, maxChars: number, overlap: number): string[] {
  const parts: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars)
    if (end < text.length) {
      const slice = text.slice(start, end)
      const cut = Math.max(
        slice.lastIndexOf('。'),
        slice.lastIndexOf('；'),
        slice.lastIndexOf('\n')
      )
      if (cut > maxChars / 2) end = start + cut + 1
    }
    parts.push(text.slice(start, end))
    if (end >= text.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return parts
}

export function splitDoc(
  source: string,
  maxChars = 600,
  overlap = 80
): Chunk[] {
  const chunks: Chunk[] = []
  const headingPath: string[] = []
  let heading = '正文'

  const emit = (text: string) => {
    const clean = text.trim()
    if (clean.length > 0) {
      chunks.push({ id: 'c' + (chunks.length + 1), heading, text: clean })
    }
  }

  for (const section of source.split(/\n(?=#{1,6}\s)/)) {
    const lines = section.split('\n')
    const match = HEADING.exec(lines[0]?.trim() ?? '')
    if (match) {
      const level = match[1]?.length ?? 1
      headingPath.length = level - 1
      headingPath[level - 1] = match[2]?.trim() ?? ''
      heading = headingPath.filter(Boolean).join(' / ')
      lines.shift()
    }

    let buffer: string[] = []
    const flush = () => {
      emit(buffer.join('\n'))
      buffer = []
    }

    for (const line of lines) {
      const paragraph = line.trim()
      if (paragraph === '') {
        // 段落边界只做标记，短段继续合并到 maxChars
        if (buffer.length > 0 && buffer[buffer.length - 1] !== '') {
          buffer.push('')
        }
        continue
      }
      const candidate = [...buffer, line].join('\n')
      if (candidate.length <= maxChars) {
        buffer.push(line)
        continue
      }
      flush()
      if (paragraph.length <= maxChars) {
        buffer.push(line)
      } else {
        for (const piece of splitLong(paragraph, maxChars, overlap)) {
          emit(piece)
        }
      }
    }
    flush()
  }
  return chunks
}`,
    caption:
      '核心函数约 60 行、整块约 85 行：按标题分节、短段合并到 `maxChars`、超长硬切。`heading` 保留标题路径（如 `退款政策 / 发票`），避免 `###` 丢父级上下文；表格与代码的单独解析在 6.6 补。'
  },
  {
    kind: 'code',
    title: 'split-demo.ts：3 行入口，验证切分结果',
    lang: 'ts',
    code: String.raw`import { splitDoc } from './split.ts'

const source = await Bun.file('doc.md').text()
for (const chunk of splitDoc(source)) {
  console.log(chunk.id + ' [' + chunk.heading + '] ' + chunk.text.length)
}`,
    caption:
      '`bun run split-demo.ts` 读取同目录的 `doc.md`；入口只负责读文件与打印，切分逻辑仍在 `splitDoc`。'
  },
  { kind: 'demo', id: 'structure-split' },
  {
    kind: 'note',
    tone: 'warn',
    title: 'CRLF 文档先归一换行',
    text: "Windows 上保存的 Markdown 可能带 `\\r\\n`。标题匹配不会失败（代码里已经 `trim`），但块文本会残留 `\\r`，进入 embedding 与引用展示后变成不可见字符。入口先做 `source.replace(/\\r\\n/g, '\\n')`，保证切分输出稳定。"
  },
  {
    kind: 'note',
    tone: 'info',
    title: '字符只是教学近似',
    text: '上面的表与 demo 都用字符数，方便肉眼观察。生产按 token 切（中文大致 1 字 ≈ 0.6-1 token，视分词器而定），并用模型的实际 tokenizer 计数；字符数只用来定初始值，最终以 token 为准。'
  },
  {
    kind: 'table',
    head: ['策略', '怎么做', '优点', '风险'],
    rows: [
      ['定长', '每 N 字符切一刀', '实现最简单', '切断句子、表格、代码'],
      [
        '递归',
        '段落 → 句子 → 字符逐级兜底',
        '兼顾语义与长度',
        '参数多，需要调'
      ],
      [
        '结构感知',
        '按标题 / 条款 / 函数切',
        '语义完整，易加元数据',
        '依赖文档本身有结构'
      ],
      [
        '语义切分',
        '按相邻句向量相似度突变切',
        '主题一致性好',
        '贵、慢、难调，首版不建议'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '语义切分不是第一选择',
    text: '语义切分要先对每个句子做 embedding，再用相邻相似度找断点，成本和复杂度都高。文档有标题结构时，结构切分已经能拿到大部分收益；等评估集建立起来，再判断要不要上语义切分。'
  },
  { kind: 'h2', text: 'chunk 大小怎么定：从问答形态反推' },
  {
    kind: 'p',
    text: 'chunk 大小没有通用最优值，要从「答案长什么样」反推。FAQ 的答案是一句话，块就该小；产品文档的答案是一段条款，块就要覆盖整段。块太大，相似度被稀释、噪声与 token 成本上升；块太小，语义不完整，模型只能拿到半句话。'
  },
  {
    kind: 'table',
    head: ['问答形态', 'chunk 参考', 'overlap', '理由'],
    rows: [
      ['FAQ / 单点事实', '200-400 字符', '0-50', '答案短，块大反而稀释相似度'],
      [
        '产品文档 / 条款',
        '400-800 字符',
        '50-100',
        '一段一个主题，保留完整条件'
      ],
      ['长文 / 研究报告', '600-1000 字符', '100', '需要上下文，靠 rerank 收口'],
      ['代码 / 表格', '按函数 / 表切', '0', '长度硬切会破坏语法与行列'],
      ['多语言混排', '按语种分段', '0', '跨语种混块会拉低相似度']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'overlap 的代价',
    text: 'overlap 只解决「边界句被切断」，解决不了「块内多主题」。它会让索引膨胀、召回重复、上下文 token 翻倍。overlap 超过 chunk 的 30% 时，先怀疑切分策略不对，而不是继续加 overlap。'
  },
  { kind: 'h2', text: 'Embedding 选型：先问四个问题' },
  {
    kind: 'p',
    text: '榜单只回答「可能不错」，选型要回答四个具体问题：语种、部署方式、预算、维度。四个问题没有答案之前，看 MTEB 总榜只是在给自己找心理安慰。'
  },
  {
    kind: 'list',
    items: [
      '**语种**：中文 / 中英混排优先 BGE-M3、Qwen3-Embedding、GTE 多语言；纯英文场景 text-embedding-3 系列够用。',
      '**部署**：能出网就用 API；数据不能出内网就本地模型（Ollama / Xinference / FlagEmbedding 起服务）。',
      '**预算**：embedding 按 token 计费，但真正的浪费是「重复 embedding」；内容 hash 缓存与增量更新比换模型更省钱。',
      '**维度**：存储与检索延迟大致是 N × 维度 × 4 bytes；支持 MRL 截断的模型先按 512 / 1024 维试，不够再加。'
    ]
  },
  {
    kind: 'table',
    head: ['模型', '维度', '语言', '部署', '适用场景'],
    rows: [
      [
        'text-embedding-3-small',
        '1536（可截断）',
        '多语言',
        'API',
        '快速起步、英文为主'
      ],
      [
        'text-embedding-3-large',
        '3072（可截断）',
        '多语言',
        'API',
        '质量优先、能接受成本'
      ],
      [
        'BGE-M3',
        '1024',
        '多语言（中文强）',
        '本地 / 自建',
        '内网、中文文档、dense + sparse'
      ],
      [
        'Qwen3-Embedding 0.6B / 4B / 8B',
        '1024 / 2560 / 4096',
        '多语言',
        '本地 / 自建',
        '中文、长文、支持指令与 MRL'
      ],
      ['GTE 多语言', '768', '多语言', '本地 / 自建', '轻量、低延迟、资源受限']
    ]
  },
  {
    kind: 'note',
    tone: 'info',
    title: '榜单只做初筛',
    text: 'MTEB 的任务分布与你的语料不同。正确做法：挑 2-3 个候选模型，用 20-50 条自己的问答对跑同一套评估（3.3 会给出最小评估集），看 recall@k 与引用命中率，而不是看总榜排名。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'query 与 document 必须同模型、同版本、同前缀',
    text: 'E5 系列要加 `query:` / `passage:` 前缀，部分 BGE 中文模型需要查询指令，Qwen3-Embedding 支持 instruct。前缀写错，分数会整体下移；中途换模型版本，旧向量必须全部重建，不能新旧混用。'
  },
  {
    kind: 'code',
    title: 'embed-batch.ts：批量、归一化、按 index 还原',
    lang: 'ts',
    code: String.raw`type EmbeddingRow = { index: number; embedding: number[] }

const baseUrl = process.env.EMBEDDING_BASE_URL ?? 'https://api.openai.com/v1'
const model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'
const apiKey = process.env.EMBEDDING_API_KEY

if (!apiKey) throw new Error('缺少 EMBEDDING_API_KEY')

function normalize(vector: number[]): number[] {
  let sum = 0
  for (const value of vector) sum += value * value
  const norm = Math.sqrt(sum)
  return norm === 0 ? vector : vector.map((value) => value / norm)
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await fetch(baseUrl + '/embeddings', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify({ model, input: texts })
  })
  if (!response.ok) throw new Error('embedding failed: ' + response.status)
  const data = (await response.json()) as { data: EmbeddingRow[] }
  if (data.data.length !== texts.length) {
    throw new Error(
      '返回条数与输入不一致：' + data.data.length + ' vs ' + texts.length
    )
  }
  // 返回顺序不保证与输入一致，必须按 index 还原
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((row) => normalize(row.embedding))
}`,
    caption:
      '批量接口的返回带 `index`，不能假设与输入同序；归一化放在入口统一做，后面的检索代码就不必重复处理。'
  },
  { kind: 'h2', text: '归一化：让 cosine 与 dot 可复现' },
  {
    kind: 'p',
    text: '3.1 讲过 cosine 只看方向、dot 受长度影响。工程上要补三条纪律：写入与查询都必须归一化，只归一化一边等于没归一化；归一化后 dot 就是 cosine，换向量库不会改变排序；原始向量要保留一份，否则以后想换 metric、看相似度分布或做聚类时无法还原。'
  },
  {
    kind: 'math',
    latex: String.raw`\begin{aligned}
\lVert v \rVert_2 &= \sqrt{\sum_{i=1}^{n} v_i^2} \\
\hat{v}_i &= \frac{v_i}{\lVert v \rVert_2} \\
\cos(\hat{q},\hat{c}) &= \hat{q}\cdot\hat{c}
\end{aligned}`,
    caption:
      '三行依次对应上一段 `normalize()` 的求范数、逐维相除，以及归一化后 dot 与 cosine 等价。第三行成立的前提是两侧都归一化过。'
  },
  {
    kind: 'code',
    title: '维度校验：挡住混用模型',
    lang: 'ts',
    code: String.raw`type StoredVector = {
  id: string
  model: string
  version: string
  vector: number[]
}

function assertSameDim(a: StoredVector, b: StoredVector): void {
  if (a.vector.length !== b.vector.length) {
    throw new Error(
      '维度不一致：' + a.model + ' ' + a.vector.length +
        ' vs ' + b.model + ' ' + b.vector.length
    )
  }
}

function assertSameModel(a: StoredVector, b: StoredVector): void {
  if (a.model !== b.model || a.version !== b.version) {
    throw new Error('向量来自不同模型或版本，必须重建索引')
  }
}`,
    caption:
      '每条向量都带 `model` 与 `version` 元数据；维度与模型校验放在检索入口，比事后排查便宜得多。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '归一化后还要不要保存原始向量',
    text: '要。归一化会丢掉长度信息：调相似度分布、做聚类、排查「为什么某类向量分数普遍低」时，原始向量是唯一的依据。换模型时必须整库重建，旧向量不能和新向量混用。'
  },
  { kind: 'h2', text: '召回差怎么归因：query、chunk、模型三层' },
  {
    kind: 'p',
    text: '按「query → chunk → 模型」的顺序查，成本从低到高。先确认 query 是否缺上下文，再看 chunk 是否切断或混杂，最后才怀疑模型。不要一上来就换更大的模型。'
  },
  {
    kind: 'table',
    head: ['层', '现象', '先查什么', '修复'],
    rows: [
      [
        'query',
        '短 query、口语化 query 召回差',
        '是否缺少上下文与关键词',
        'query 改写、加指令前缀、HyDE（6.4）'
      ],
      [
        'chunk',
        '答案在 top-5 却不在 top-1',
        '块是否太大、边界是否切断',
        '缩小块、加 rerank、调 k'
      ],
      [
        'chunk',
        '多个结果内容重复',
        'overlap 是否过大',
        '降 overlap、按内容去重'
      ],
      [
        '模型',
        'top-1 完全不相关',
        '是否同一模型 / 版本 / 前缀',
        '重建索引、补前缀、换模型'
      ],
      [
        '模型',
        '中文明显差、英文还行',
        '模型的中文能力',
        '换多语言模型（BGE-M3 / Qwen3-Embedding）'
      ]
    ]
  },
  {
    kind: 'checklist',
    title: '归因顺序（从便宜到贵）',
    items: [
      '打印 query 与 top-3 的分数、chunk id、chunk 前 40 字',
      '确认 query 与文档向量来自同一模型、同一版本、同一前缀',
      '确认 gold 所在 chunk 没有被切分切断或与多主题混块',
      '确认归一化在写入与查询两侧都执行',
      '最后才做模型 A/B：同一评估集，换模型重跑，比较 recall@k'
    ]
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '同一份 Markdown 用 `maxChars` 300 / 600 / 800 各切一次，记录块数与平均长度',
      '结构切分的块之间没有重复文本；超长段落硬切时相邻块有重叠',
      '所有向量 L2 norm ≈ 1，维度一致；混入旧模型向量时校验能报错',
      '同一 query 用 cosine 与归一化后的 dot 排序结果完全一致',
      '能给出一条召回失败案例，并归因到 query / chunk / 模型中的一层'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 `split.ts`（结构切分 + 长度兜底）、`embed-batch.ts`（批量 + 归一化 + 按 index 还原）、一张 Embedding 选型表与一张召回归因表。下一篇 3.3 用三条断言把检索质量变成可回归的评估。'
  },
  {
    kind: 'exercise',
    title: '3.2 练习：把切分与向量调对',
    items: [
      {
        id: 's3-2-e1',
        level: '基础',
        question:
          '找一篇带二级标题、且至少有一节超过 300 字符的 Markdown，用 `splitDoc` 切分；把 `maxChars` 从 300 调到 800，记录块数与平均长度。',
        hint: '固定 overlap，只改 maxChars；先确认某一节确实超过 300 字符，否则三档结果会相同。',
        answer:
          'maxChars 变大，块数减少、平均长度上升；如果所有节都短于 300 字符，三档块数相同也是正确结果（一节一块）。',
        solution:
          '块数下降是预期；重点看两类异常：块长度接近 maxChars 却被切开（说明单节过长），以及出现只有一句话的碎块（说明段落切得太碎）。'
      },
      {
        id: 's3-2-e2',
        level: '改造',
        question:
          '给每个 chunk 加上 `heading`、`source` 与 `model` 元数据，并在检索结果里打印。说明这些字段在引用与过滤时各有什么用。',
        hint: '结构切分已经带 heading；再补文档来源与模型版本。',
        answer:
          'heading 用于引用定位与按章节过滤；source 用于多文档溯源；model 用于挡住新旧向量混用。',
        solution:
          '元数据不要只存不用：检索结果里打印 heading 与 source，引用格式用 [chunkId] heading；model 与 version 在检索入口做校验。'
      },
      {
        id: 's3-2-e3',
        level: '排障',
        question:
          '同一份文档、同一批 query，换了一个 Embedding 模型后所有分数都变低。列出三种可能原因，并给出验证顺序。',
        hint: '从「模型 / 版本 / 前缀 / 归一化 / 维度」五个词里挑三个最容易出错的。',
        answer:
          'query 与文档用了不同模型或版本；查询前缀 / 指令没加；只归一化了一侧或维度混用。',
        solution:
          '先打印两侧向量的 model 元数据与维度；再检查查询前缀是否与该模型要求一致；最后确认写入与查询都归一化。三项都没问题，才是模型本身不适合你的语料。'
      },
      {
        id: 's3-2-e4',
        level: '设计',
        question:
          '1000 篇中文产品文档、部署在内网、预算有限。按「语种 / 部署 / 成本 / 维度」四问给出 Embedding 方案，并说明什么情况下换方案。',
        hint: '内网意味着不能用公网 API；预算有限意味着要考虑缓存与维度。',
        answer:
          'BGE-M3 或 Qwen3-Embedding-0.6B 本地部署，1024 维，内容 hash 缓存 + 增量更新；中文召回明显不足或长文效果差时再考虑更大模型。',
        solution:
          '先用 0.6B / 1024 维起步，测 QPS 与显存；文档更新按内容 hash 只重算变化块；评估集 recall@k 不达标再换 4B 或加 rerank，不要一上来拉满。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'chunk 怎么切？',
        '结构优先（标题 / 段落 / 句子），长度兜底；overlap 只加在硬切处，用来接住边界句。'
      ],
      [
        'Embedding 怎么选？',
        '四问：语种、部署、预算、维度；榜单只初筛，必须用自己的评估集做 A/B。'
      ],
      [
        '为什么要归一化？',
        '让 dot 与 cosine 等价，换向量库排序不变；写入与查询两侧都要做。'
      ],
      [
        '召回差怎么归因？',
        '按 query → chunk → 模型的顺序查，成本从低到高；多数问题不在模型。'
      ],
      [
        'chunk 是不是越大越好？',
        '不是。块大上下文多，但相似度被稀释、噪声与 token 成本上升；块要匹配答案形态。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：overlap 设多少合适？',
    text: '先看切分方式：结构切分可以 0；硬切一般取 chunk 的 10%-20%。overlap 的目的是接住被切断的边界句，不是提高召回的手段。overlap 设到 30% 以上，说明切分策略本身有问题。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Embeddings',
        href: 'https://platform.openai.com/docs/guides/embeddings',
        note: '批量接口、维度与计费'
      },
      {
        label: 'BGE-M3 模型卡',
        href: 'https://huggingface.co/BAAI/bge-m3',
        note: '多语言、1024 维、dense + sparse'
      },
      {
        label: 'Qwen3-Embedding 模型卡',
        href: 'https://huggingface.co/Qwen/Qwen3-Embedding-0.6B',
        note: '维度、指令用法与 MRL 支持'
      },
      {
        label: 'MTEB Leaderboard',
        href: 'https://huggingface.co/spaces/mteb/leaderboard',
        note: 'Embedding 模型榜单，只作初筛'
      },
      {
        label: 'rag-algorithms：分块与向量表示',
        href: 'https://belos-street.github.io/kb-vault/artificial-intelligence/agent/rag-algorithms/README.html',
        note: '分块策略与向量表示的算法细节'
      }
    ]
  }
]
