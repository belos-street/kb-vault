import type { Block } from '../data/types.ts'

export const lesson26: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**链路追踪**。Agent 能跑、能记状态之后，下一步是「出问题时知道哪一步坏了」。这一篇只做接入与会看：环境变量、Trace 结构、失败定位；指标看板、评估与成本回归留给 10.1 / 10.3 / 10.4。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: 'Trace 不是日志，是调用树',
    text: '普通日志告诉你「发生了一件事」；Trace 告诉你「这次 invoke 里，模型、工具、中间件各自花了多久、输入输出是什么、哪一步报错」。排障时先看树，再看单条日志。'
  },
  {
    kind: 'checklist',
    title: '运行前检查',
    items: [
      '`langsmith` 已随 `langchain` / `@langchain/langgraph` 安装',
      '本地自检：`LANGSMITH_TRACING=false`，traceable 包装的代码不联网也能跑通',
      '线上验收：`LANGSMITH_API_KEY` 与 `LANGSMITH_PROJECT` 已设置，能打开 LangSmith Trace 页面'
    ]
  },
  { kind: 'h2', text: '接入：环境变量，零代码' },
  {
    kind: 'code',
    title: '环境变量',
    lang: 'bash',
    code: String.raw`export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2_sk_xxx
export LANGSMITH_PROJECT=customer-service-v1

# 自部署或私有化时再加
export LANGSMITH_ENDPOINT=https://api.smith.langchain.com`,
    caption:
      'LANGSMITH_TRACING 是总开关；LANGSMITH_PROJECT 用来区分项目；Key 不要写进代码仓库。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: '项目与区域的适用边界',
    text: '`LANGSMITH_PROJECT` 适用于 project-based workspace；agent-based workspace 的目的地配置不同，按当期控制台提示。`LANGSMITH_ENDPOINT` 不只用于自部署，非 US 区域也要设为对应区域的端点。'
  },
  {
    kind: 'p',
    text: 'LangChain 的 `createAgent`、模型、工具、Runnable 默认会读取这些环境变量并上报 Trace，不需要在业务代码里手动埋点。'
  },
  {
    kind: 'code',
    title: '给一次 invoke 加标签与元数据',
    lang: 'ts',
    code: String.raw`const result = await agent.invoke(
  { messages: [{ role: 'user', content: '杭州天气' }] },
  {
    tags: ['production', 'weather'],
    metadata: {
      userId: 'u_1024',
      tenantId: 't_acme',
      env: 'prod'
    }
  }
)`,
    caption:
      'tags 用于粗筛，metadata 用于精确定位；不要把手机号、身份证等敏感信息写进 metadata。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'Trace 会记录输入输出',
    text: 'Prompt、用户消息、工具参数与返回都可能被上报。上线前要用 PII 中间件脱敏，或确认 LangSmith 项目的数据保留策略；不要把密钥、完整订单、身份证号打进 Trace。'
  },
  { kind: 'h2', text: 'Trace 结构：一棵调用树' },
  {
    kind: 'code',
    title: '一次 Agent invoke 的典型结构',
    lang: 'text',
    code: String.raw`agent.invoke
├── ChatOpenAI (第 1 次)
│   ├── input: system + 用户消息
│   └── output: tool_calls: weather({ city: "杭州" })
├── weather
│   ├── input: { "city": "杭州" }
│   └── output: { "tempC": 22, "tomorrow": "中雨" }
└── ChatOpenAI (第 2 次)
    ├── input: 历史 + tool 结果
    └── output: "杭州明天有中雨，建议带伞。"`,
    caption:
      '父子关系就是执行关系：模型调工具，工具结果回填后再调模型。中间件会以独立 span 出现在对应节点。'
  },
  {
    kind: 'table',
    head: ['看什么', '说明', '排障用途'],
    rows: [
      ['Status', 'success / error', '先找最深的红色 span'],
      ['Latency', '每个 span 的耗时', '定位慢在模型还是工具'],
      ['Tokens', 'prompt / completion / total', '定位成本与上下文膨胀'],
      ['Input / Output', '原始输入输出', '复现格式错误、参数错误'],
      ['Metadata', 'userId / tenantId / env', '按用户或环境过滤'],
      ['Child spans', '模型、工具、中间件', '看循环次数与调用顺序']
    ]
  },
  { kind: 'demo', id: 'trace-tree' },
  { kind: 'h2', text: '失败定位：先找最深的错误 span' },
  {
    kind: 'table',
    head: ['现象', 'Trace 里先看什么', '常见原因'],
    rows: [
      [
        '模型输出解析失败',
        '模型 span 的 raw output',
        '没走结构化输出 / Prompt 格式漂移'
      ],
      [
        '工具超时或 5xx',
        '工具 span 的 error 与 duration',
        '下游服务故障、没配重试'
      ],
      ['Token 超限', 'prompt tokens 是否接近窗口', '历史没裁、检索塞太多'],
      ['Agent 死循环', '同一工具是否被重复调用', '漏回填 tool 消息、没有上限'],
      ['PII 被拦截', 'middleware span 的判定', '策略过严或输入未脱敏']
    ]
  },
  {
    kind: 'p',
    text: '排障顺序：先看根 span 是否 error，再顺着最深的错误子 span 往下找；工具错误看 input/output，模型错误看 token 与 finish_reason，中间件错误看它拦在哪一步。不要只看最后一句回答。'
  },
  {
    kind: 'code',
    title: '非 LangChain 步骤用 traceable 包一层',
    lang: 'ts',
    code: String.raw`import { traceable } from 'langsmith/traceable'

const retrieve = traceable(
  async (query: string) => {
    // 自定义检索 / 数据库查询 / 外部 API
    return []
  },
  { name: 'retrieve' }
)`,
    caption:
      'traceable 让自定义步骤也进入同一棵 Trace；name 用稳定的英文名，方便按 span 名筛选。'
  },
  {
    kind: 'code',
    title: '本地自检：没有 Key 也能验证埋点',
    lang: 'ts',
    code: String.raw`process.env.LANGSMITH_TRACING = 'false'

const docs = await retrieve('退款多久到账')
console.log(docs.length) // 0：不联网也能跑，埋点不阻断调用`,
    caption:
      '这一段只验证 traceable 包装不破坏业务；完整 Trace 树与失败定位仍然需要 LangSmith UI 与 Key。'
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '采样与成本',
    text: 'Trace 会产生存储与网络成本。生产上按流量采样、只对关键租户或错误请求全量保留；具体采样配置以当期 LangSmith 文档为准。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '设置 `LANGSMITH_TRACING` / `LANGSMITH_API_KEY` 后，一次 invoke 能在 LangSmith 看到完整 Trace',
      '没有 Key 时，`LANGSMITH_TRACING=false` 下 `traceable` 包装的函数能正常返回',
      '能说出一次 Agent Trace 的父子结构：invoke → 模型 → 工具 → 模型',
      '能给 Trace 加 tags / metadata，并按它们过滤',
      '能在 Trace 里定位一次工具失败：找到最深的错误 span 与 error 信息'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走环境变量清单、Trace 结构与指标表、失败定位清单和 traceable 用法。到这里阶段二的框架主线收口；指标看板、评估集与成本回归留给阶段十。'
  },
  {
    kind: 'exercise',
    title: '2.6 练习：从 Trace 找问题',
    items: [
      {
        id: 's2-6-e1',
        level: '基础',
        question:
          '给一次天气 Agent 调用加 `tags: ["dev", "weather"]` 与 `metadata.userId`，在 LangSmith 里按 tag 过滤到这条 Trace。',
        hint: 'tags 是字符串数组，metadata 是键值对。',
        answer: '能在 Trace 列表按 tag / metadata 过滤到目标请求。',
        solution:
          'tags 适合粗筛，metadata 适合精确定位；不要把所有信息都塞进 tags。'
      },
      {
        id: 's2-6-e2',
        level: '排障',
        question:
          'Trace 显示模型调用 6 次、weather 工具 6 次，参数完全一样，最后超时。按 Trace 给出三条修复。',
        hint: '看工具 span 的 output 是否成功回填，再看有没有调用上限。',
        answer:
          '检查 tool 消息是否漏回填、加 toolCallLimitMiddleware、加 recursionLimit / maxSteps。',
        solution:
          'Trace 里如果 tool span 成功但下一轮模型还在调，通常是 tool_call_id 或消息角色不对；不是模型「笨」。'
      },
      {
        id: 's2-6-e3',
        level: '设计',
        question:
          '为生产环境设计一套 Trace 采样与保留策略：哪些请求全量保留，哪些按比例采样，保留多久？',
        hint: '从错误、关键租户、普通流量三类请求分别考虑成本与排障需求。',
        answer:
          '错误与关键租户全量；普通流量按 1%–10% 采样；原始 Trace 保留 7–30 天，指标长期聚合。',
        solution:
          '采样率要可配置；先保证错误请求可追，再谈成本优化。敏感字段在进入 Trace 前脱敏。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '怎么定位一次 Agent 失败？',
        '先看根 span 是否 error，再找最深的错误子 span；工具看 input/output，模型看 token 与 finish_reason，中间件看拦截点。'
      ],
      [
        'Agent 该监控哪些指标？',
        '成功率、P50/P95 延迟、token 与成本、工具错误率、循环次数、按租户/模型的分布（详见 10.3）。'
      ],
      [
        'Trace 怎么控成本？',
        '错误与关键租户全量，普通流量采样；脱敏后再上报；保留期与合规要求对齐。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：Trace 和日志、指标怎么分工？',
    text: 'Trace 回答「这一次为什么坏」，指标回答「整体是否变坏」，日志回答「某个事件的具体细节」。三者不要互相替代：先看指标发现异常，再用 Trace 定位一次请求，最后看日志确认细节。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangSmith Observability Quickstart',
        href: 'https://docs.langchain.com/langsmith/observability-quickstart',
        note: '环境变量与首次 Trace'
      },
      {
        label: 'LangSmith Trace with LangChain',
        href: 'https://docs.langchain.com/langsmith/trace-with-langchain',
        note: 'LangChain 自动上报与 tags / metadata'
      },
      {
        label: 'LangSmith Observability Concepts',
        href: 'https://docs.langchain.com/langsmith/observability-concepts',
        note: 'Trace、Run、Span 与指标'
      },
      {
        label: 'LangSmith 文档',
        href: 'https://docs.langchain.com/langsmith/home',
        note: '项目、过滤、评估与数据保留'
      }
    ]
  }
]
