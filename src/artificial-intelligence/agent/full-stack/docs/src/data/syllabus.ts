import type { Chapter, LessonMeta } from './types.ts'

function lesson(
  input: Omit<LessonMeta, 'minutes'> & { minutes?: number }
): LessonMeta {
  const minutes =
    input.minutes ?? (input.depth === '精讲' ? 90 : input.depth === '速过' ? 30 : 20)
  return { ...input, minutes }
}

function pending(
  input: Omit<
    LessonMeta,
    'minutes' | 'live' | 'assertions' | 'interview' | 'artifact'
  >
): LessonMeta {
  return lesson({
    ...input,
    live: false,
    artifact: '待更新',
    assertions: [],
    interview: []
  })
}

export const chapters: Chapter[] = [
  {
    id: 's1',
    label: '阶段一',
    title: '从第一次调用到第一个 Agent',
    goal:
      '把「AI 是什么」压缩到面试够用的最小集，同时一次立好工程基线：代码先行，概念跟着代码走。',
    lessons: [
      lesson({
        id: 's1-1',
        number: '1.1',
        title: 'OpenAI SDK：30 行跑通第一次调用',
        tagline: '用官方 SDK 跑通调用，配置、超时与错误类型一次到位。',
        depth: '精讲',
        points: [
          'OpenAI SDK 最小调用',
          'token 与上下文窗口',
          'temperature 与采样',
          '幻觉与成本',
          '模型选型决策树',
          '长上下文 vs RAG',
          '微调 vs RAG vs Prompt'
        ],
        live: true,
        variable: 'LLM API 调用',
        unchanged: '不引入框架、不接数据库',
        artifact: 'SDK call-llm.ts + 配置 + 成本表',
        assertions: [
          '控制台打印 choices[0].message.content',
          '返回 usage 中的 prompt / completion tokens',
          '错误 Key 命中 AuthenticationError，超时命中 APIConnectionTimeoutError'
        ],
        interview: [
          'token 怎么计费',
          '长上下文与 RAG 怎么选',
          '微调 / RAG / Prompt 怎么选'
        ]
      }),
      lesson({
        id: 's1-2',
        number: '1.2',
        title: '一个 core，两个入口：CLI 与 Hono 流式接口',
        tagline: '模型调用收进 core，CLI 与 Hono 只做最小适配。',
        depth: '精讲',
        points: [
          'Llm 边界与 SDK 适配器',
          'CLI 入口',
          'Hono 路由与入参',
          'SSE 流式输出',
          '入口与 core 的职责划分'
        ],
        live: true,
        variable: '入口',
        unchanged: '不引入配额、JWT / session、审计',
        artifact: 'Zod + API Key + 统一错误码的 SSE 最小服务',
        assertions: [
          '无 authorization 返回 401，code 为 unauthorized',
          '空 message 返回 400，code 为 invalid_body',
          '`curl -N` 带鉴权能看到 delta 与 done',
          '`chat.ts` 不依赖 hono / openai / process.env'
        ],
        interview: [
          '为什么选 Hono，而不是 Express / Fastify',
          'SSE 与 WebSocket 怎么选',
          'core 与入口的边界怎么划',
          '怎么保证 CLI 与 HTTP 行为一致'
        ]
      }),
      lesson({
        id: 's1-3',
        number: '1.3',
        title: 'Prompt 工程：从「会问」到「可验证」',
        tagline: '把 Prompt 当契约：结构化输出、few-shot、CoT、版本化。',
        depth: '精讲',
        points: [
          'Prompt 四段结构',
          '结构化输出与重试',
          'few-shot 选择',
          'CoT 的适用边界',
          '模板版本化',
          '注入防护基础'
        ],
        live: true,
        variable: 'Prompt 契约',
        unchanged: '不引入工具循环、不引入 RAG',
        artifact: 'ticket-classify 模板 + 解析重试 + /api/classify 接线',
        assertions: [
          '同一输入渲染结果固定，带 id 与 version',
          '解析失败能回填重试一次并成功',
          '持续非 JSON 时走到 schema_unrecoverable'
        ],
        interview: [
          '怎么让输出稳定可解析',
          'few-shot 怎么选',
          'Prompt 注入怎么防'
        ]
      }),
      lesson({
        id: 's1-4',
        number: '1.4',
        title: 'Agent 范式：手写最小工具循环',
        tagline: '用 OpenAI SDK 的 tools 写一遍 ReAct，再故意撞三个坑。',
        depth: '精讲',
        points: [
          'ReAct 循环',
          'Function Calling 协议',
          '并行工具调用',
          '参数校验与回填',
          '死循环兜底',
          'Memory 与 Planning 地图'
        ],
        live: true,
        variable: '工具循环',
        unchanged: '不引入 LangChain、不引入图',
        artifact: 'agent.ts + /api/agent / agent-cli 接线 + 三个失败断言',
        assertions: [
          '用 fake Llm 断言 messages 序列：assistant(toolCalls) → tool → assistant',
          '两个并行 toolCalls 的 toolCallId 都能对上',
          '循环能触发 max_steps_exceeded 而不是挂住',
          '`bun run agent` 与 `POST /api/agent` 走 createAgent，`/api/chat` 保留 SSE'
        ],
        interview: [
          'Agent 与 Chain 的区别',
          'ReAct 循环怎么工作',
          'Function Calling 协议是什么',
          '怎么防死循环'
        ]
      })
    ]
  },
  {
    id: 's2',
    label: '阶段二',
    title: 'LangChain.js 单 Agent 工程',
    goal: '用框架把 Agent 写完整：工具、结构化输出、记忆、中间件、追踪。',
    lessons: [
      lesson({
        id: 's2-1',
        number: '2.1',
        title: 'createAgent：用框架重写天气 Agent',
        tagline: '先跑通再讲架构：包生态地图、Model + Harness、Runnable。',
        depth: '精讲',
        points: [
          'createAgent 快速上手',
          '包生态地图',
          'Runnable 协议',
          '与手写 1.4 的 diff'
        ],
        live: true,
        variable: '框架',
        unchanged: '不改业务、不改工具',
        artifact: 'createAgent 版天气 Agent + 1.4/2.1 职责对照表',
        assertions: [
          '`bun run demo` 输出 3 个 PASS 与 `all createAgent checks passed`',
          'createAgent 自动执行工具并回填，最终回答包含工具结果',
          '非法参数返回 error ToolMessage，模型可据此修正'
        ],
        interview: [
          'createAgent 解决了什么',
          'LangChain 的抽象基类是什么',
          'Runnable 解决什么问题'
        ]
      }),
      lesson({
        id: 's2-2',
        number: '2.2',
        title: '模型与消息系统',
        tagline: '多 Provider、消息角色、模板与流式事件。',
        depth: '速过',
        points: [
          '多 Provider 初始化',
          '消息类型与 contentBlocks',
          'Prompt 模板',
          'streamEvents'
        ],
        live: true,
        variable: '模型与消息',
        unchanged: '不引入工具、不引入记忆',
        artifact: '模型初始化两种写法 + 常用消息速查表 + streamEvents 消费代码',
        assertions: [
          '能用字符串与实例两种方式初始化同一个模型',
          '能构造 System / Human / AI / Tool 四个常用角色并让 tool_call_id 对上',
          '能只消费 on_chat_model_stream 的文本 chunk'
        ],
        interview: [
          '消息角色怎么设计',
          '流式事件怎么消费',
          '多 Provider 怎么初始化'
        ]
      }),
      lesson({
        id: 's2-3',
        number: '2.3',
        title: '工具与输出契约',
        tagline: '同一套 Zod 契约，管住工具入参与最终输出。',
        depth: '精讲',
        points: [
          '工具契约三层：入参 Schema / 权限上下文 / 输出 Schema',
          'tool() + Zod',
          'Runtime Context 与权限',
          '工具错误与重试',
          '工具太多：分组 / 检索 / 收窄',
          'responseFormat 与结构化输出'
        ],
        live: true,
        variable: '工具与输出契约',
        unchanged: '不引入图、不引入多 Agent',
        artifact: 'tool() + Zod + responseFormat 的最小 Agent',
        assertions: [
          '非法入参被 Zod 拒绝，错误可读',
          '合法入参返回可序列化的 `{ ok: true, data }`',
          '`responseFormat` 经假模型产出结构化结果并通过 Zod'
        ],
        interview: [
          '工具怎么定义',
          '工具太多怎么办',
          '如何保证结构化输出稳定可解析'
        ]
      }),
      lesson({
        id: 's2-4',
        number: '2.4',
        title: '记忆与状态管理',
        tagline: '用状态生命周期串起 Thread ID、Checkpointer 与裁剪。',
        depth: '精讲',
        points: [
          'Thread ID',
          'MemorySaver',
          '持久化 Checkpointer',
          '上下文裁剪',
          'trimMessages / summarization'
        ],
        live: true,
        variable: '状态生命周期',
        unchanged: '不引入图、不引入长期记忆',
        artifact: 'Thread ID + MemorySaver 最小示例 + 裁剪/摘要配置',
        assertions: [
          '同一 thread_id 的第二轮能带上第一轮消息',
          '不同 thread_id 的消息互不影响',
          '能把上下文裁回预算内'
        ],
        interview: [
          '多轮对话怎么存',
          '上下文怎么裁',
          'Checkpointer 怎么选'
        ]
      }),
      lesson({
        id: 's2-5',
        number: '2.5',
        title: '中间件系统',
        tagline: '把重试、PII、HITL、todo 挂到 Agent 循环的扩展点上。',
        depth: '精讲',
        points: [
          '六类钩子与洋葱顺序',
          '重试：modelRetry / toolRetry',
          'PII 过滤与脱敏策略',
          'HITL 中间件与 checkpointer',
          'toolCallLimit / todoList',
          '1.4 三个坑的中间件收口',
          '自定义中间件'
        ],
        live: true,
        variable: '中间件扩展点',
        unchanged: '不展开 interrupt / 断点恢复',
        artifact: '中间件顺序图 + auditMiddleware + HITL 配置 + 项目 02 v1 收口示例',
        assertions: [
          '能说出 beforeModel → wrapModelCall → afterModel → wrapToolCall 的执行顺序',
          'PII 脱敏在模型调用前生效',
          'HITL 在 refund 执行前中断，approve 后继续'
        ],
        interview: [
          '中间件在 Agent 循环的哪个位置执行',
          'HITL 怎么实现',
          '重试、PII、HITL 应该放在哪一层'
        ]
      }),
      lesson({
        id: 's2-6',
        number: '2.6',
        title: 'LangSmith 链路追踪',
        tagline: '先把 trace 接进来、会看，再谈指标与评估。',
        depth: '速过',
        points: ['环境变量接入', 'Trace 结构', '失败定位', 'tags / metadata'],
        live: true,
        variable: '链路追踪',
        unchanged: '不展开评估集与回归',
        artifact: 'Trace 结构图 + 环境变量清单 + 失败定位清单',
        assertions: [
          '配好环境变量后一次 invoke 能在 LangSmith 看到完整 Trace',
          '能说出一次 Agent Trace 的父子结构',
          '能在 Trace 里定位一次工具失败'
        ],
        interview: [
          '怎么定位一次 Agent 失败',
          'Agent 该监控哪些指标',
          'Trace 怎么控成本'
        ]
      })
    ]
  },
  {
    id: 's3',
    label: '阶段三',
    title: '最小 RAG（零中间件入门）',
    goal: '不装任何中间件，用 50 行把「文档 → 向量 → 检索 → 回答」跑通。',
    lessons: [
      lesson({
        id: 's3-1',
        number: '3.1',
        title: '检索第一原理：50 行内存检索',
        tagline: 'chunk → embed → cosine → top-k，先把检索手感建立起来。',
        depth: '精讲',
        points: [
          'chunk → embed → cosine → top-k',
          '为什么需要向量检索',
          'cosine 与 dot / 归一化',
          'top-k 与阈值',
          '引用与拒答',
          '召回差怎么归因'
        ],
        live: true,
        variable: '检索闭环',
        unchanged: '不装 Docker、不装数据库',
        artifact: '50 行内存检索 CLI',
        assertions: [
          'top-1 命中 `c1`（以示例模型与 3 条语料为准）',
          '输出带 chunk id 与 `[c1]` 引用',
          '无关 query 的最高分显著低于相关 query（同一模型与语料）'
        ],
        interview: [
          'RAG 全链路',
          'cosine 与 dot 的区别',
          '为什么要 chunk'
        ]
      }),
      pending({
        id: 's3-2',
        number: '3.2',
        title: '文档切分、Embedding 与召回质量',
        tagline: '切分策略、Embedding 选型、归一化与召回归因。',
        depth: '精讲',
        points: ['切分策略与 overlap', 'Embedding 选型', '归一化', '召回差归因'],
        variable: '切分与向量质量',
        unchanged: '不引入向量库'
      }),
      pending({
        id: 's3-3',
        number: '3.3',
        title: '最小 RAG 评估',
        tagline: '三条可断言：命中、引用、拒答；手算 recall@k。',
        depth: '速过',
        points: ['recall@k', '忠实度', '命中 / 引用 / 拒答'],
        variable: '评估',
        unchanged: '不引入评估平台'
      })
    ]
  },
  {
    id: 's4',
    label: '阶段四',
    title: 'LangGraph 图编排',
    goal: '只引入「图」这一个新变量，用客服 v1 对比两种实现。',
    lessons: [
      pending({
        id: 's4-1',
        number: '4.1',
        title: '从 createAgent 到图：把客服 v1 重写',
        tagline: '为什么需要显式控制流，createAgent 的边界在哪里。',
        depth: '精讲',
        points: ['显式控制流', '图的四要素', 'createAgent 边界'],
        variable: '图编排',
        unchanged: '不改业务、不改工具'
      }),
      pending({
        id: 's4-2',
        number: '4.2',
        title: 'State、reducer 与节点契约',
        tagline: 'StateSchema、reducer 归并、节点返回值、消息裁剪。',
        depth: '精讲',
        points: ['StateSchema', 'reducer', '节点返回值', '消息裁剪'],
        variable: 'State 与 reducer',
        unchanged: '不引入路由'
      }),
      pending({
        id: 's4-3',
        number: '4.3',
        title: '条件路由、循环与防失控',
        tagline: '两种路由、recursionLimit、退出条件。',
        depth: '精讲',
        points: ['addConditionalEdges', 'Command 路由', 'recursionLimit', '退出条件'],
        variable: '路由与循环',
        unchanged: '不引入中断'
      }),
      pending({
        id: 's4-4',
        number: '4.4',
        title: '中断与检查点：可恢复的图',
        tagline: 'interrupt、Checkpointer、断点恢复；子图与并行只了解。',
        depth: '精讲',
        points: ['interrupt', 'Checkpointer', '断点恢复', '子图 / 并行（了解）'],
        variable: '可恢复',
        unchanged: '不展开子图与并行'
      })
    ]
  },
  {
    id: 's5',
    label: '阶段五',
    title: '多 Agent 协作',
    goal: '单图不够用时才上多 Agent：先学拓扑与边界，再学分解与容错。',
    lessons: [
      pending({
        id: 's5-1',
        number: '5.1',
        title: '多 Agent 拓扑与选型',
        tagline: 'Supervisor / Hierarchical / Peer-to-Peer，以及什么时候不该用。',
        depth: '精讲',
        points: ['三种拓扑', '上下文隔离', '不该用多 Agent 的场景'],
        variable: '多 Agent 拓扑',
        unchanged: '不改单 Agent 业务'
      }),
      pending({
        id: 's5-2',
        number: '5.2',
        title: '任务分解、上下文传递与结果聚合',
        tagline: '子任务 Schema、上下文裁剪、结果合并、冲突处理。',
        depth: '精讲',
        points: ['子任务 Schema', '上下文裁剪', '结果合并', '冲突处理'],
        variable: '任务分解',
        unchanged: '不引入容错'
      }),
      pending({
        id: 's5-3',
        number: '5.3',
        title: '容错、降级与调试',
        tagline: '限流、超时、Fallback 模型链、Trace 定位失败节点。',
        depth: '精讲',
        points: ['限流', '超时', 'Fallback 链', '失败节点定位'],
        variable: '多 Agent 容错',
        unchanged: '不引入基础设施'
      })
    ]
  },
  {
    id: 's6',
    label: '阶段六',
    title: '检索工程（生产检索栈）',
    goal: '把 50 行检索逐级换成生产组件，Retriever 接口不变。',
    lessons: [
      pending({
        id: 's6-1',
        number: '6.1',
        title: '向量库入门：pgvector / Qdrant',
        tagline: '持久化、collection、索引、元数据过滤、upsert。',
        depth: '精讲',
        points: ['持久化', 'collection', '索引', '元数据过滤', 'upsert'],
        variable: '向量库',
        unchanged: '不改 Retriever 接口'
      }),
      pending({
        id: 's6-2',
        number: '6.2',
        title: 'Milvus 索引调优与最小架构',
        tagline: 'HNSW / IVF 参数、过滤下推、segment 最小模型。',
        depth: '精讲',
        points: ['HNSW / IVF', '过滤下推', 'segment 最小模型'],
        variable: 'Milvus 调优',
        unchanged: '不展开分层架构'
      }),
      pending({
        id: 's6-3',
        number: '6.3',
        title: '混合召回：BM25 + 向量 + RRF',
        tagline: '双路召回的最小实现，以及 RRF 与加权融合的取舍。',
        depth: '精讲',
        points: [
          '双路召回：稀疏 BM25 + 稠密向量',
          'RRF 与加权融合',
          '三路以上怎么扩展',
          '什么时候不值得混合'
        ],
        variable: '混合召回',
        unchanged: '不改向量库'
      }),
      pending({
        id: 's6-4',
        number: '6.4',
        title: '重排与查询改写',
        tagline: 'cross-encoder rerank、HyDE、多查询、成本权衡。',
        depth: '精讲',
        points: ['rerank', 'HyDE', '多查询', '成本权衡'],
        variable: '重排与改写',
        unchanged: '不引入图谱'
      }),
      pending({
        id: 's6-5',
        number: '6.5',
        title: 'GraphRAG 与知识图谱',
        tagline: 'Neo4j 与 Cypher 最小集、Local / Global、何时值得上图谱。',
        depth: '引子',
        points: ['Neo4j 最小集', 'Local / Global', '适用场景'],
        variable: '图谱',
        unchanged: '不展开图算法'
      }),
      pending({
        id: 's6-6',
        number: '6.6',
        title: '文档解析与异步入库',
        tagline: '多格式解析、PostgreSQL job 表、幂等与失败重试。',
        depth: '精讲',
        points: ['多格式解析', 'IndexJob', '幂等', '失败重试'],
        variable: '入库流水线',
        unchanged: '不引入 MQ / 对象存储'
      }),
      pending({
        id: 's6-7',
        number: '6.7',
        title: '文档治理：审核、RBAC 与版本',
        tagline: '审核状态机、RBAC 与检索可见性、知识库版本。',
        depth: '速过',
        points: ['审核状态机', 'RBAC', '检索可见性', '版本与生命周期'],
        variable: '治理',
        unchanged: '不展开认证协议'
      })
    ]
  },
  {
    id: 's7',
    label: '阶段七',
    title: 'Agentic RAG 与协议生态',
    goal: '检索组件齐了，才让 Agent 决定要不要检索，再把工具协议化。',
    lessons: [
      pending({
        id: 's7-1',
        number: '7.1',
        title: 'Agentic RAG：让检索会决策',
        tagline: '检索前决策、文档打分、改写重试、Self-RAG、防失控。',
        depth: '精讲',
        points: ['检索前决策', '文档打分', '改写重试', 'Self-RAG', '防失控'],
        variable: '检索决策',
        unchanged: '不改检索组件'
      }),
      pending({
        id: 's7-2',
        number: '7.2',
        title: 'MCP 协议与 Server 开发',
        tagline: 'Server / Client / Transport、TS SDK、工具与资源注册。',
        depth: '精讲',
        points: ['MCP 三要素', 'TS SDK', '工具注册', '资源注册'],
        variable: 'MCP Server',
        unchanged: '不展开安全'
      }),
      pending({
        id: 's7-3',
        number: '7.3',
        title: 'MCP Client、安全与生态',
        tagline: '接入 LangChain、权限最小化、工具投毒、MCP vs A2A。',
        depth: '精讲',
        points: ['MCP Client', '权限最小化', '工具投毒', 'MCP vs A2A'],
        variable: 'MCP 安全',
        unchanged: '不改 Server 协议'
      }),
      pending({
        id: 's7-4',
        number: '7.4',
        title: 'DeepAgents 开箱框架',
        tagline: '虚拟文件系统、子 Agent 委派、上下文压缩、选型对比。',
        depth: '速过',
        points: ['虚拟文件系统', '子 Agent', '上下文压缩', '选型'],
        variable: '开箱框架',
        unchanged: '不展开源码'
      })
    ]
  },
  {
    id: 's8',
    label: '阶段八',
    title: '流式交互层',
    goal: '把 Agent 能力通过流式协议暴露给前端，做「能看见过程」的界面。',
    lessons: [
      pending({
        id: 's8-1',
        number: '8.1',
        title: 'Vercel AI SDK 核心',
        tagline: 'useChat / useCompletion、消息协议、工具调用渲染。',
        depth: '精讲',
        points: ['useChat', 'useCompletion', '消息协议', '工具调用渲染'],
        variable: '前端流式 SDK',
        unchanged: '不改后端 Agent'
      }),
      pending({
        id: 's8-2',
        number: '8.2',
        title: 'AGUI 与 SSE 端到端',
        tagline: 'Hono streamSSE、事件设计、断线重连、错误降级。',
        depth: '精讲',
        points: ['streamSSE', '事件设计', '断线重连', '错误降级'],
        variable: '端到端流式',
        unchanged: '不改 Agent 逻辑'
      }),
      pending({
        id: 's8-3',
        number: '8.3',
        title: 'Agent UI 设计',
        tagline: '思维链、工具过程、错误态、取消与重试。',
        depth: '速过',
        points: ['思维链展示', '工具过程', '错误态', '取消与重试'],
        variable: 'Agent UI',
        unchanged: '不改协议'
      })
    ]
  },
  {
    id: 's9',
    label: '阶段九',
    title: '后端基础设施与部署',
    goal: '从本机 compose 到可部署、可扩缩、可回滚。',
    lessons: [
      pending({
        id: 's9-1',
        number: '9.1',
        title: 'Docker 容器化',
        tagline: 'Bun 多阶段构建、镜像瘦身、健康检查、compose。',
        depth: '精讲',
        points: ['多阶段构建', '镜像瘦身', '健康检查', 'compose'],
        variable: '容器化',
        unchanged: '不改业务代码'
      }),
      pending({
        id: 's9-2',
        number: '9.2',
        title: '部署与 K8s 基础',
        tagline: 'Serverless vs 容器、Pod / Service / Deployment、探针。',
        depth: '速过',
        points: ['Serverless vs 容器', 'K8s 核心对象', 'ConfigMap / Secret', '探针'],
        variable: '部署',
        unchanged: '不搭集群'
      }),
      pending({
        id: 's9-3',
        number: '9.3',
        title: 'PostgreSQL 落地',
        tagline: 'Prisma / Drizzle、多租户隔离、Checkpoint 共库、pgvector。',
        depth: '精讲',
        points: ['Prisma / Drizzle', '多租户隔离', 'Checkpoint 共库', 'pgvector'],
        variable: '关系库',
        unchanged: '不改检索接口'
      }),
      pending({
        id: 's9-4',
        number: '9.4',
        title: 'Redis 会话、缓存与长期记忆',
        tagline: '会话缓存、JWT / session、SCAN、长期记忆选型。',
        depth: '速过',
        points: ['会话缓存', 'JWT / session', 'SCAN', '长期记忆选型'],
        variable: '缓存与会话',
        unchanged: '不改数据库模型'
      }),
      pending({
        id: 's9-5',
        number: '9.5',
        title: '消息队列与对象存储',
        tagline: 'RabbitMQ / BullMQ、ACK 与死信、S3 预签名；替换 IndexJob。',
        depth: '精讲',
        points: ['MQ 选型', 'ACK 与死信', '延迟重试', 'S3 预签名'],
        variable: '队列与对象存储',
        unchanged: '不改 IndexJob 接口'
      }),
      pending({
        id: 's9-6',
        number: '9.6',
        title: 'CI/CD 与配置管理',
        tagline: 'GitHub Actions、环境变量、灰度与回滚。',
        depth: '速过',
        points: ['GitHub Actions', '环境变量', '灰度', '回滚'],
        variable: '交付流水线',
        unchanged: '不改应用架构'
      })
    ]
  },
  {
    id: 's10',
    label: '阶段十',
    title: '可观测、评估与成本',
    goal: '上线不是终点，能看见、能评估、能算账才是。',
    lessons: [
      pending({
        id: 's10-1',
        number: '10.1',
        title: 'LangSmith 全链路追踪',
        tagline: 'Trace、Token、延迟、失败节点定位。',
        depth: '精讲',
        points: ['Trace', 'Token', '延迟', '失败节点'],
        variable: '全链路追踪',
        unchanged: '不改业务逻辑'
      }),
      pending({
        id: 's10-2',
        number: '10.2',
        title: 'Langfuse 与 OpenTelemetry',
        tagline: '自托管、双通道接入、与 LangSmith 对照。',
        depth: '速过',
        points: ['自托管', '双通道', '选型对照'],
        variable: '可观测选型',
        unchanged: '不改指标体系'
      }),
      pending({
        id: 's10-3',
        number: '10.3',
        title: 'Prometheus + Grafana',
        tagline: '指标设计、告警规则、看板。',
        depth: '速过',
        points: ['指标设计', '告警规则', '看板'],
        variable: '指标与告警',
        unchanged: '不改追踪'
      }),
      pending({
        id: 's10-4',
        number: '10.4',
        title: 'Agent 测试与评估',
        tagline: 'Mock LLM、集成测试、评估集、回归、CI；幻觉分层治理。',
        depth: '精讲',
        points: ['Mock LLM', '集成测试', '评估集', '回归', '幻觉治理'],
        variable: '测试与评估',
        unchanged: '不改成本策略'
      }),
      pending({
        id: 's10-5',
        number: '10.5',
        title: '性能与成本优化',
        tagline: '缓存、批处理、Token 截断、限流熔断、预算护栏。',
        depth: '精讲',
        points: ['缓存', '批处理', 'Token 截断', '限流熔断', '预算护栏'],
        variable: '成本与性能',
        unchanged: '不改评估体系'
      })
    ]
  },
  {
    id: 's11',
    label: '阶段十一',
    title: '安全、合规与前沿',
    goal: '把「能上线」变成「敢上线」。',
    lessons: [
      pending({
        id: 's11-1',
        number: '11.1',
        title: 'Agent 安全防护',
        tagline: '直接 / 间接注入、工具权限、输出过滤、敏感信息脱敏。',
        depth: '精讲',
        points: ['提示注入', '工具权限', '输出过滤', '脱敏'],
        variable: '安全防护',
        unchanged: '不改业务主流程'
      }),
      pending({
        id: 's11-2',
        number: '11.2',
        title: 'OWASP LLM Top 10 与合规',
        tagline: '十项风险映射到实现点、数据生命周期与合规。',
        depth: '速过',
        points: ['OWASP LLM Top 10', '数据生命周期', '合规'],
        variable: '风险映射',
        unchanged: '不展开法律条文'
      }),
      pending({
        id: 's11-3',
        number: '11.3',
        title: '多模态与语音',
        tagline: '图像理解、ASR + 流式 TTS、时延与成本。',
        depth: '引子',
        points: ['图像理解', 'ASR', '流式 TTS', '时延与成本'],
        variable: '多模态链路',
        unchanged: '不展开模型训练'
      }),
      pending({
        id: 's11-4',
        number: '11.4',
        title: '自主 Agent 与 Computer Use',
        tagline: '浏览器自动化、沙箱隔离、E2B、风险边界。',
        depth: '引子',
        points: ['浏览器自动化', '沙箱隔离', 'E2B', '风险边界'],
        variable: '自主执行',
        unchanged: '不展开 OS 内核'
      })
    ]
  }
]

export const allLessons = chapters.flatMap((chapter) => chapter.lessons)

export const lessonById = new Map(allLessons.map((item) => [item.id, item]))

export const chapterById = new Map(
  chapters.map((chapter) => [chapter.id, chapter])
)

export const liveLessons = allLessons.filter((item) => item.live)

export const totalMinutes = allLessons.reduce(
  (sum, item) => sum + item.minutes,
  0
)

export const depthCounts = {
  精讲: allLessons.filter((item) => item.depth === '精讲').length,
  速过: allLessons.filter((item) => item.depth === '速过').length,
  引子: allLessons.filter((item) => item.depth === '引子').length
}
