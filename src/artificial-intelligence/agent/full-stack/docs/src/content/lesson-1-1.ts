import type { Block } from '../data/types.ts'

export const lesson11: Block[] = [
  {
    kind: 'p',
    text: '这一篇只做一件事：用官方 OpenAI SDK 跑通一次模型调用。配置收进 client，超时与重试交给 SDK；你只需要看清 `content`、`usage` 和错误类型。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '为什么用 SDK，不手写 fetch',
    text: 'SDK 已经把 `baseURL`、鉴权头、超时、重试、类型和错误分类封装好了；手写 `fetch` 省不了多少代码，却会把精力花在协议细节上。协议仍然要看，但放在排障时看，不作为主线。'
  },
  { kind: 'h2', text: '先跑通：30 行 SDK 调用' },
  {
    kind: 'p',
    text: '安装官方 SDK：`bun add openai`。把 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`DEFAULT_MODEL` 换成你的服务商配置；SDK 通过 `baseURL` 兼容 DeepSeek、Ollama、vLLM 等 OpenAI 兼容端点。'
  },
  {
    kind: 'code',
    title: 'call-llm.ts',
    lang: 'ts',
    code: String.raw`import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('缺少 OPENAI_API_KEY')
  process.exit(1)
}

const client = new OpenAI({
  apiKey,
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  timeout: Number(process.env.LLM_TIMEOUT_MS ?? 30_000),
  maxRetries: 2
})

const model = process.env.DEFAULT_MODEL ?? 'gpt-4o-mini'

try {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: '你是一个简洁的助手。' },
      { role: 'user', content: '用一句话解释什么是 token。' }
    ]
  })

  console.log(response.choices[0]?.message.content ?? '')
  console.log('usage:', response.usage)
} catch (error) {
  if (error instanceof OpenAI.AuthenticationError) {
    console.error('401：Key 无效或未带上')
  } else if (error instanceof OpenAI.RateLimitError) {
    console.error('429：限流，稍后重试')
  } else if (error instanceof OpenAI.APIConnectionTimeoutError) {
    console.error('超时：检查网络或调大 timeout')
  } else {
    console.error('调用失败：', error)
  }
  process.exitCode = 1
}`,
    caption:
      '核心约 30 行；`baseURL` 负责兼容端点，`timeout` 与 `maxRetries` 由 SDK 统一处理，错误用 SDK 的类型分支识别。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`bun add openai` 已执行',
      '环境变量已设置：`OPENAI_API_KEY`，可选 `OPENAI_BASE_URL` / `DEFAULT_MODEL`',
      '网络能访问服务商；公司代理需要额外配置',
      '运行 `bun run call-llm.ts`，看到一段回答与 usage',
      '把 Key 改错能看到 `AuthenticationError`；把 timeout 改成 1ms 能看到超时错误'
    ]
  },
  {
    kind: 'p',
    text: '预期输出分两段：第一段是模型回答，第二段是 `usage`。如果 `usage` 为空，先确认服务商是否返回用量字段；不要假设所有 OpenAI 兼容网关都返回同样的结构。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '三个最常见的第一次失败',
    text: '401：`AuthenticationError`，Key 错了或没带上；404：`baseURL` 多了或少了 `/v1`；429：`RateLimitError`，触发限流。SDK 会自动重试部分错误，所以看到 429 时先确认 `maxRetries` 与业务重试没有叠加。'
  },
  { kind: 'h2', text: 'token、上下文与成本' },
  {
    kind: 'p',
    text: 'token 是计费单位，也是上下文窗口的计量单位。中文大致 1~2 token/字，英文大致 4 个字符 1 token；不同 tokenizer 偏差很大，工程上要按实际 usage 记账，不要靠字数硬猜。'
  },
  { kind: 'demo', id: 'token-cost' },
  {
    kind: 'p',
    text: '上下文窗口不是「能塞多少就塞多少」。输入越长，成本越高、延迟越大，而且中间位置的信息更容易被忽略。工程上要给 system、历史、检索、输出分别留预算。'
  },
  { kind: 'demo', id: 'context-window' },
  {
    kind: 'table',
    head: ['概念', '工程影响', '本讲怎么处理'],
    rows: [
      ['token', '计费与窗口占用', '按 usage 记账，不按字数猜'],
      [
        '上下文窗口',
        '能放多少消息与文档',
        '四段预算：system / 历史 / 检索 / 输出'
      ],
      ['temperature', '输出随机性', '事实任务低温度，创意任务再调高'],
      ['幻觉', '看起来合理但事实错误', '引用、结构化输出、拒答三件套'],
      ['成本', '输入 + 输出 token × 单价', '先算单次成本，再乘调用量']
    ]
  },
  { kind: 'h2', text: '温度、幻觉与可验证性' },
  {
    kind: 'p',
    text: '`temperature` 控制采样随机性。低温度更稳定，适合抽取、分类、工具调用；高温度更发散，适合头脑风暴。它不是「聪明度」旋钮，调高不会让模型更懂业务。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '幻觉不是「模型记错了」，而是「没有依据也敢回答」',
    text: '工程上不要指望一句「不要编造」解决幻觉。更可靠的做法是：给依据（RAG）、要求引用、输出结构化字段、没有依据时允许拒答。这四件事分别落在阶段三、2.3、10.4。'
  },
  {
    kind: 'list',
    items: [
      '**引用**：回答必须带 chunk id 或原文片段，方便人工复核。',
      '**结构化**：把 intent、orderId、confidence 等字段拆出来，解析失败可重试。',
      '**拒答**：检索分数低于阈值时明确说「没有足够依据」，而不是硬编。',
      '**评估**：用固定问题集回归，不靠单次观感。'
    ]
  },
  { kind: 'h2', text: '模型选型：先选约束，不选品牌' },
  {
    kind: 'p',
    text: '模型型号会过时，约束不会。先问五个问题：成本是否敏感、是否需要长上下文、是否以代码 / 工具调用为主、是否需要多模态、是否必须私有化。答案会把你带到不同的模型类别，而不是某一个品牌。'
  },
  { kind: 'demo', id: 'model-picker' },
  {
    kind: 'table',
    head: ['约束', '优先方向', '不要做什么'],
    rows: [
      ['高频、短任务', '高性价比模型 + 小模型路由', '用旗舰模型跑分类 / 摘要'],
      [
        '长文档一次读完',
        '长上下文模型 + 检索兜底',
        '把「塞得进去」当成「答得准」'
      ],
      ['代码 / Agent', '工具调用稳定的模型 + 回归集', '只看代码补全榜单'],
      ['图片 / 表格', '原生多模态或 OCR + 文本模型', '所有图片都先 OCR'],
      ['数据不出内网', '开源自托管 + 量化评估', '默认开源一定便宜']
    ]
  },
  { kind: 'h2', text: '两张决策表：长上下文 vs RAG，微调 vs RAG vs Prompt' },
  {
    kind: 'p',
    text: '这两张表是面试高频，也是架构选型的起点。下面两张就是结论表；更长的追问清单再放附录（选做）。'
  },
  {
    kind: 'table',
    head: ['场景', '优先方案', '原因'],
    rows: [
      [
        '文档总量小、变化慢、问题集中',
        '长上下文直接读',
        '少一套检索链路，调试简单'
      ],
      ['文档量大、更新频繁、需要引用', 'RAG', '可增量索引、可溯源、成本可控'],
      ['两者都想要', '长上下文 + RAG 兜底', '先检索压缩，再交给长上下文组织'],
      [
        '问题需要跨文档推理',
        'RAG + 图谱 / Agentic RAG',
        '单次相似度不够，需要多跳'
      ]
    ]
  },
  {
    kind: 'table',
    head: ['手段', '适合解决', '代价'],
    rows: [
      ['Prompt', '表达方式、格式、角色、少量示例', '最便宜，但不改变模型知识'],
      ['RAG', '私有知识、时效信息、引用溯源', '要建索引、评估召回'],
      ['微调', '固定风格、固定输出格式、领域术语', '要数据、要训练、要回归'],
      ['微调 + RAG', '领域表达 + 私有知识', '复杂度最高，先别默认上']
    ]
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '选型顺序',
    text: '先 Prompt，再 RAG，最后才微调。能把问题约束在「给依据 + 要格式」里的，不要急着训练模型。'
  },
  { kind: 'h2', text: '3 条验收' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '`bun run call-llm.ts` 能打印 `response.choices[0].message.content`',
      '能打印 `response.usage.prompt_tokens` 与 `completion_tokens`',
      '把 Key 改错后，能命中 `AuthenticationError`；把 timeout 改到 1ms，能命中 `APIConnectionTimeoutError`'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走三样东西：`call-llm.ts` 最小调用、一个 token 成本计算器、两张选型决策表。下一篇 1.2 会把这次调用收进 core，再用 CLI 和 HTTP 两个入口复用同一份逻辑。'
  },
  {
    kind: 'exercise',
    title: '1.1 练习：从跑通到会算账',
    items: [
      {
        id: 's1-1-e1',
        level: '基础',
        question:
          '把 `temperature` 从 0.2 改到 0.9，连续运行 3 次，记录输出差异。',
        hint: '先固定同一个问题，连续跑 3 次；只改 temperature，别改 system prompt。',
        answer: '输出会更发散，措辞与结构更不稳定；事实任务不建议高温度。',
        solution:
          '同一问题跑 3 次，比较长度、措辞、是否引入新事实。注意：高温度不是「更聪明」，只是采样更随机。'
      },
      {
        id: 's1-1-e2',
        level: '改造',
        question:
          '把 system prompt 改成「只输出 JSON」，观察模型是否稳定返回可解析 JSON。',
        hint: '连续跑 3 次，把每次输出贴进 JSON.parse；统计解析失败次数。',
        answer:
          '不稳定；需要结构化输出 / responseFormat 才能把「可解析」变成契约。',
        solution:
          '运行 3 次，统计有多少次能被 `JSON.parse`。多数模型会在 JSON 前后加解释文字，这正是 1.3 要解决的问题。'
      },
      {
        id: 's1-1-e3',
        level: '排障',
        question:
          '把 `OPENAI_API_KEY` 改错、把 `OPENAI_BASE_URL` 指向不存在的域名、用本地假服务返回 429，分别记录错误类型。',
        hint: '在 catch 里打印 `error.name`、`error.status` 与 `error.message`；SDK 已经把错误分好类。',
        answer:
          '`AuthenticationError` / 连接错误 / `RateLimitError` 的 name、status 与 message 都不同，分支要能区分。',
        solution:
          '用 `instanceof OpenAI.AuthenticationError`、`OpenAI.RateLimitError`、`OpenAI.APIConnectionError` 分别处理；不要把 `error.message` 当唯一判据。'
      },
      {
        id: 's1-1-e4',
        level: '设计',
        question: '日调用 10 万次的客服场景，写 5 条 token 预算与降级策略。',
        hint: '按「输入 / 输出 / 路由 / 缓存 / 限流」五个格子各写一条。',
        answer: '参考答案：分模型路由、输入截断、输出上限、缓存、429 降级。',
        solution:
          '示例：简单意图走小模型；输入超过 8k 先摘要；输出 maxTokens 设上限；FAQ 命中走缓存；429 时降级到备用模型并提示稍后重试。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        'token 怎么计费？',
        '输入 token + 输出 token 分别计价，输出通常更贵；按 usage 记账，不按字数猜。'
      ],
      [
        '长上下文和 RAG 怎么选？',
        '文档小、变化慢、问题集中可长上下文；量大、更新频繁、要引用则 RAG；两者可组合。'
      ],
      [
        '微调、RAG、Prompt 怎么选？',
        '先 Prompt，再 RAG，最后微调；微调解决风格与格式，不解决私有知识时效。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：什么时候不该建向量库？',
    text: '文档总量很小、更新很少、问题范围固定，或者只需要关键词精确匹配时，先别建库。长上下文、BM25、甚至一个结构化 FAQ 表都可能更便宜、更好排障。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'OpenAI Node SDK',
        href: 'https://github.com/openai/openai-node',
        note: '官方 TypeScript SDK、配置项与错误类型'
      },
      {
        label: 'OpenAI Chat Completions API',
        href: 'https://platform.openai.com/docs/api-reference/chat',
        note: '请求结构、usage、错误码'
      },
      {
        label: 'OpenAI Tokenizer',
        href: 'https://platform.openai.com/tokenizer',
        note: '直观感受中英文 token 差异'
      },
      {
        label: 'OpenAI Pricing',
        href: 'https://openai.com/api/pricing/',
        note: '按当期价目替换计算器里的单价'
      }
    ]
  }
]
