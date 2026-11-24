import { useMemo, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type Phase = '装配期' | '请求期' | '循环内' | '可观测 / 排障'

interface ApiItem {
  id: string
  name: string
  phase: Phase
  when: string
  caution: string
  lesson: string
}

const phases: Phase[] = ['装配期', '请求期', '循环内', '可观测 / 排障']

const items: ApiItem[] = [
  {
    id: 'create-agent',
    name: 'createAgent',
    phase: '装配期',
    when: '服务启动时装配一次：模型、工具、System Prompt、中间件、checkpointer 都在这时确定，所有请求复用同一个 Agent。',
    caution:
      '不要在请求处理函数里重建 Agent：会话状态、连接池与 Trace 关联都会断。',
    lesson: '2.1'
  },
  {
    id: 'tool-def',
    name: 'tool(fn, { schema })',
    phase: '装配期',
    when: '模块加载时定义工具：函数实现 + description + Zod Schema 三件套，随 Agent 一起装配。',
    caution:
      '不要在每次请求里动态 new 工具；description 是模型选工具的主要依据。',
    lesson: '2.3'
  },
  {
    id: 'model-init',
    name: 'ChatOpenAI / initChatModel',
    phase: '装配期',
    when: '启动时按环境选 provider：单 provider 用实例，多 provider 用字符串加通用初始化。',
    caution:
      '换 provider 报 model not found，先查 provider 包与模型前缀，不是先改 Prompt。',
    lesson: '2.2'
  },
  {
    id: 'prompt-template',
    name: 'ChatPromptTemplate',
    phase: '装配期',
    when: '自己组链、需要版本化模板时在装配期创建；createAgent 内直接用 systemPrompt 即可。',
    caution: '不要把多轮历史拼成字符串，角色与 tool_call_id 会全部丢失。',
    lesson: '2.2'
  },
  {
    id: 'memory-saver',
    name: 'MemorySaver',
    phase: '装配期',
    when: '开发或测试时给 Agent 挂 checkpointer，让每步 State 自动保存。',
    caution: '跨进程 HITL、重启恢复必须换 PostgresSaver 等持久化实现。',
    lesson: '2.4'
  },
  {
    id: 'middleware-inst',
    name: '中间件实例',
    phase: '装配期',
    when: '启动时放进 middleware 数组：重试、PII、HITL、调用上限都在装配期确定。',
    caution: '数组顺序就是执行语义；PII 晚于模型、HITL 晚于工具都会失效。',
    lesson: '2.5'
  },
  {
    id: 'invoke',
    name: 'agent.invoke',
    phase: '请求期',
    when: '一次请求要完整结果时调用；后台任务、普通接口都走它。',
    caution: '多轮对话必须带同一个 thread_id，否则每次都是全新消息数组。',
    lesson: '2.1'
  },
  {
    id: 'stream',
    name: 'agent.stream',
    phase: '请求期',
    when: '需要看循环过程时调用：updates 看节点增量，messages 看逐 token。',
    caution: 'streamMode 决定看到什么；不要拿 updates 当 token 流。',
    lesson: '2.1'
  },
  {
    id: 'stream-events',
    name: 'agent.streamEvents',
    phase: '请求期',
    when: '前端要细粒度事件时调用：监听 on_chat_model_stream、on_tool_start/end。',
    caution: '只挑需要的事件消费，不要打印整段事件对象。',
    lesson: '2.2'
  },
  {
    id: 'thread-id',
    name: 'config.thread_id',
    phase: '请求期',
    when: '多轮、HITL、断点恢复时随请求传入，标识一段对话。',
    caution: 'thread_id 不是 user_id：一个用户可以有多个会话。',
    lesson: '2.4'
  },
  {
    id: 'context',
    name: 'config.context',
    phase: '请求期',
    when: '工具需要身份、角色、租户时随请求传入，供 runtime.context 读取。',
    caution:
      '必须在 Agent 上声明 contextSchema；否则类型与运行时校验都不完整。',
    lesson: '2.3'
  },
  {
    id: 'tags',
    name: 'tags / metadata',
    phase: '请求期',
    when: '需要按业务线、环境、用户过滤 Trace 时随请求传入。',
    caution: 'metadata 不要写手机号、身份证等敏感信息。',
    lesson: '2.6'
  },
  {
    id: 'tool-body',
    name: 'tool 函数体',
    phase: '循环内',
    when: '模型返回 tool_calls 后由运行时执行；权限校验的最后一道门放在这里。',
    caution: '不能只把权限写在 system prompt 里，注入可以绕过 Prompt。',
    lesson: '2.3'
  },
  {
    id: 'before-model',
    name: 'beforeModel / wrapModelCall',
    phase: '循环内',
    when: '每次模型调用前后触发：裁剪历史、PII 脱敏、重试、fallback。',
    caution: 'wrap* 必须调用 handler(request)，否则模型不会执行。',
    lesson: '2.5'
  },
  {
    id: 'after-model',
    name: 'afterModel / HITL',
    phase: '循环内',
    when: '模型返回 tool_calls 后、工具执行前触发：审批拦截、调用上限。',
    caution:
      'humanInTheLoopMiddleware 依赖 checkpointer，没有它第一次 invoke 就报错。',
    lesson: '2.5'
  },
  {
    id: 'wrap-tool',
    name: 'wrapToolCall',
    phase: '循环内',
    when: '每次工具调用前后触发：权限、缓存、工具重试、审计。',
    caution:
      '并行 tool_calls 会分别进入这里，日志要带 tool_call_id，不要假设串行。',
    lesson: '2.5'
  },
  {
    id: 'response-format',
    name: 'responseFormat',
    phase: '循环内',
    when: '模型产出最终结果后按 Schema 解析；下游要类型安全时配置。',
    caution: '解析失败按三级处理，不要无限重试；读取后仍建议 safeParse 一次。',
    lesson: '2.3'
  },
  {
    id: 'get-state',
    name: 'agent.graph.getState',
    phase: '可观测 / 排障',
    when: '排查「历史到底存了什么」时读取 State 快照；业务调用不需要手动读。',
    caution: '看不到历史先查 thread_id 与 checkpointer，再查是否被裁剪。',
    lesson: '2.4'
  },
  {
    id: 'traceable',
    name: 'traceable',
    phase: '可观测 / 排障',
    when: '装配期包住自定义检索、数据库、外部 API，让它们进入同一棵 Trace；出问题时按 span 名定位。',
    caution: 'name 用稳定的英文名，方便在 LangSmith 里按 span 名筛选。',
    lesson: '2.6'
  },
  {
    id: 'langsmith-env',
    name: 'LANGSMITH_* 环境变量',
    phase: '可观测 / 排障',
    when: '启动时开启自动上报；createAgent、模型、工具默认读取，无需手写埋点。',
    caution:
      'Trace 会记录输入输出，上线前先脱敏；ENDPOINT 只在自部署 / 非 US 区域设置。',
    lesson: '2.6'
  }
]

export function ApiLifecycleDemo() {
  const [phase, setPhase] = useState<Phase | '全部'>('全部')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesPhase = phase === '全部' || item.phase === phase
      const haystack = `${item.name} ${item.when} ${item.caution} ${item.lesson}`
      return (
        matchesPhase && (!keyword || haystack.toLowerCase().includes(keyword))
      )
    })
  }, [phase, query])

  const current = visible.find((item) => item.id === selectedId) ?? visible[0]

  return (
    <DemoFrame
      title="API 调用时机查询台"
      hint="先选生命周期，再看这个 API 该在什么时候调、放错会怎样。">
      <div className="mem-tabs">
        {(['全部', ...phases] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`mem-tab${phase === item ? ' active' : ''}`}
            onClick={() => setPhase(item)}>
            <strong>{item}</strong>
            <span>
              {item === '全部'
                ? items.length
                : items.filter((api) => api.phase === item).length}{' '}
              个
            </span>
          </button>
        ))}
      </div>

      <label className="tool-field">
        <span>搜索 API 或场景</span>
        <input
          value={query}
          placeholder="例如：thread / 脱敏 / 结构化"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="picker-options">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`picker-option${current?.id === item.id ? ' active' : ''}`}
            onClick={() => setSelectedId(item.id)}>
            <strong>{item.name}</strong>
            <span>
              {item.phase} · {item.lesson}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mem-empty">没有匹配的 API，换个关键词或切回「全部」。</p>
      ) : null}

      {current ? (
        <div className="picker-result">
          <span className="picker-tag">
            {current.phase} · 第 {current.lesson} 篇
          </span>
          <h4>{current.name}</h4>
          <p>{current.when}</p>
          <div className="picker-anti">
            <span>放错的后果</span>
            <p>{current.caution}</p>
          </div>
        </div>
      ) : null}

      <p className="demo-note">
        查询台只覆盖阶段二出现过的
        API。看到需求先定生命周期，再回对应篇目查参数全量。
      </p>
    </DemoFrame>
  )
}
