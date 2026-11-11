import type { Block } from '../data/types.ts'

export const lesson24: Block[] = [
  {
    kind: 'p',
    text: '这一篇只加一个变量：**状态生命周期**。上一章的 Agent 已经能调工具，但每次 `invoke` 都是全新的消息数组。这一篇把「创建线程 → 读取历史 → 持久化 → 裁剪」串起来，让多轮对话真正接得上。'
  },
  {
    kind: 'note',
    tone: 'decision',
    title: '记忆不是一个大对象，是四个动作',
    text: '创建（thread_id）→ 读取（checkpointer 按 id 取快照）→ 持久化（每步保存 State）→ 裁剪（token / 消息数超预算时处理）。四个动作分开配，排障时才知道是哪一步断了。'
  },
  { kind: 'h2', text: 'Thread ID + Checkpointer：让第二轮接上第一轮' },
  {
    kind: 'code',
    title: 'memory.ts',
    lang: 'ts',
    code: String.raw`import { createAgent } from 'langchain'
import { MemorySaver } from '@langchain/langgraph'

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  checkpointer: new MemorySaver()
})

const config = { configurable: { thread_id: 'user-bob' } }

await agent.invoke(
  { messages: [{ role: 'user', content: '我叫 Bob，喜欢喝美式' }] },
  config
)

const result = await agent.invoke(
  { messages: [{ role: 'user', content: '我叫什么？喜欢喝什么？' }] },
  config
)`,
    caption:
      '同一 thread_id 的第二轮会自动带上第一轮消息；你只需要传新消息，不需要手动拼历史。'
  },
  {
    kind: 'note',
    tone: 'info',
    title: 'thread_id 不是 user_id',
    text: 'thread_id 标识「一段对话」，user_id 标识「一个人」。一个用户可以有多个 thread（新开会话、不同工单）；一个 thread 也可以有多个参与者。不要把两者混成一个字段。'
  },
  {
    kind: 'code',
    title: '检查 State：只用于调试',
    lang: 'ts',
    code: String.raw`const state = await agent.graph.getState(config)
console.log(state.values.messages.length)

for (const message of state.values.messages) {
  console.log(message.getType(), message.content)
}`,
    caption:
      'agent.graph.getState 用于排查「历史到底存了什么」；业务调用不需要手动读 State。'
  },
  { kind: 'demo', id: 'memory-lifecycle' },
  { kind: 'h2', text: 'Checkpointer 选型：内存、持久化与边界' },
  {
    kind: 'table',
    head: ['Checkpointer', '适用', '边界'],
    rows: [
      ['MemorySaver', '开发、测试、单进程演示', '进程重启就丢，不能跨进程恢复'],
      [
        'PostgresSaver',
        '生产、需要跨进程恢复',
        '依赖 PostgreSQL，需要建表与清理策略'
      ],
      ['SqliteSaver', '单机轻量', '并发与多实例能力有限'],
      ['自定义 Saver', '已有存储体系', '要自己保证一致性、TTL 与迁移']
    ]
  },
  {
    kind: 'note',
    tone: 'warn',
    title: 'HITL 跨进程审批不能用 MemorySaver',
    text: '2.5 的 HITL 依赖 checkpointer 保存中断现场。如果审批发生在另一个进程或第二天，MemorySaver 已经丢了，必须用持久化 Saver。开发期就要按「会不会跨进程恢复」来选，不要只看环境。'
  },
  { kind: 'h2', text: '裁剪：先 trim，再考虑摘要' },
  {
    kind: 'p',
    text: '上下文不是「能塞多少塞多少」。输入越长，成本越高、延迟越大，中间位置的信息也更容易被忽略。最小策略是先按 token 预算裁剪，再在长会话里考虑摘要。'
  },
  {
    kind: 'code',
    title: 'trimMessages：保留最近的消息',
    lang: 'ts',
    code: String.raw`import { trimMessages } from 'langchain'

const trimmed = await trimMessages(state.values.messages, {
  maxTokens: 1200,
  strategy: 'last',
  tokenCounter: (messages) => messages.length * 40,
  startOn: 'human',
  endOn: 'human'
})`,
    caption:
      'tokenCounter 这里是粗估；生产要换成真实 tokenizer。startOn / endOn 保证裁剪后仍从一条 Human 消息开始和结束。'
  },
  {
    kind: 'code',
    title: 'summarizationMiddleware：长会话摘要',
    lang: 'ts',
    code: String.raw`import { createAgent, summarizationMiddleware } from 'langchain'
import { MemorySaver } from '@langchain/langgraph'

const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  checkpointer: new MemorySaver(),
  middleware: [
    summarizationMiddleware({
      model: 'openai:gpt-4o-mini',
      trigger: { tokens: 4000, messages: 20 },
      keep: { messages: 10 }
    })
  ]
})`,
    caption:
      '摘要会额外调用一次模型：省下的是后续每轮的输入 token，付出的是摘要本身的成本与信息损失。'
  },
  {
    kind: 'table',
    head: ['策略', '保留什么', '代价'],
    rows: [
      ['trimMessages', '最近 N 条 / N token', '更早的信息直接丢失'],
      [
        'summarizationMiddleware',
        '摘要 + 最近消息',
        '额外模型调用；摘要可能失真'
      ],
      ['检索式记忆', '按需召回历史片段', '多一套检索与存储（阶段六 / 9.4）']
    ]
  },
  {
    kind: 'note',
    tone: 'tip',
    title: '先看 token 分布，再定阈值',
    text: '不要拍脑袋写 `maxTokens: 1200`。先用真实请求统计输入 token 的 P50 / P95，再结合模型窗口与成本预算定裁剪线；否则不是白裁，就是裁得太晚。'
  },
  { kind: 'h2', text: '长期记忆：本篇只划边界' },
  {
    kind: 'p',
    text: '跨会话记住用户偏好、事实、习惯，属于长期记忆，不应该塞进同一个 checkpointer。LangChain 用 `store` 提供长期存储，工具里通过 `runtime.store` 访问；选型与命名空间设计放在 9.4，本篇不展开。'
  },
  {
    kind: 'note',
    tone: 'warn',
    title: '短期与长期不要混',
    text: '短期记忆是「这段对话说过什么」，长期记忆是「这个用户是谁」。混在一个 thread 里，删对话会误删偏好，改偏好又会污染上下文。'
  },
  { kind: 'h2', text: '验收清单' },
  {
    kind: 'p',
    text: '最小可运行工程在 `docs/examples/2-4-memory`。在 `docs/` 下运行 `cd examples/2-4-memory && bun install && bun run demo`，会看到 3 个 PASS：同 thread 带上历史、不同 thread 隔离、`trimMessages` 裁剪。它使用假模型，不需要真实 LLM。'
  },
  {
    kind: 'checklist',
    title: '本篇跑通的标准',
    items: [
      '同一 thread_id 的第二轮能回答第一轮说过的名字',
      '不同 thread_id 的消息互不影响',
      '`agent.graph.getState(config)` 能看到累积的 messages',
      '能用 trimMessages 或 summarizationMiddleware 把上下文压回预算内'
    ]
  },
  { kind: 'h2', text: '本讲产出' },
  {
    kind: 'p',
    text: '带走 Thread ID + MemorySaver 的最小多轮示例、checkpointer 选型表、trimMessages 与摘要中间件配置。下一篇 2.5 把重试、PII、HITL 挂到 Agent 循环的扩展点上（已上线，可回看）。'
  },
  {
    kind: 'exercise',
    title: '2.4 练习：把状态管住',
    items: [
      {
        id: 's2-4-e1',
        level: '基础',
        question:
          '用同一个 thread_id 连续问两轮「我叫 Bob」「我叫什么」，再换一个 thread_id 问「我叫什么」，观察差异。',
        hint: '第二轮只传新消息；换 thread_id 时不要复用同一个 config。',
        answer: '同 thread 能回答 Bob；换 thread 后模型没有 Bob 的信息。',
        solution:
          '检查两次 invoke 的 config.configurable.thread_id；不一致时历史不会串。'
      },
      {
        id: 's2-4-e2',
        level: '改造',
        question:
          '把 MemorySaver 换成 PostgresSaver，重启进程后再问「我叫什么」。',
        hint: '`bun add @langchain/langgraph-checkpoint-postgres`；`import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"`；首次使用 `await checkpointer.setup()` 建表。',
        answer: '进程重启后仍能恢复同一 thread 的历史。',
        solution:
          '确认 setup 只执行一次、连接池复用、thread_id 规则稳定；否则恢复不到同一快照。'
      },
      {
        id: 's2-4-e3',
        level: '排障',
        question:
          '前端说「第二轮忘了第一轮」，按本篇的四步生命周期，先查哪一步？',
        hint: '创建 → 读取 → 持久化 → 裁剪，逐步排除。',
        answer:
          '先查 thread_id 是否一致，再查 checkpointer 是否真的挂上，最后查是否被裁剪掉。',
        solution:
          '打印两次 invoke 的 thread_id 与 state.messages；如果 state 有历史但模型没看到，再查裁剪与摘要。'
      },
      {
        id: 's2-4-e4',
        level: '设计',
        question:
          '设计一个客服系统的状态方案：thread_id 怎么定、短期存哪、长期存哪、何时裁剪。',
        hint: '从会话边界、存储、恢复、成本四个维度写。',
        answer:
          'thread_id = 工单 / 会话 id；短期 PostgresSaver；长期 Store 按 user namespace；超过 token 预算先 trim，长会话再摘要。',
        solution:
          '不要让 thread_id 跟用户绑定；不要把所有历史永久塞进上下文；审计与删除策略要跟 9.4 对齐。'
      }
    ]
  },
  { kind: 'h2', text: '面试问答' },
  {
    kind: 'table',
    head: ['问题', '一句话答案'],
    rows: [
      [
        '多轮对话怎么存？',
        'checkpointer + thread_id：每步保存 State，同 thread 自动恢复，新 thread 天然隔离。'
      ],
      [
        '上下文怎么裁？',
        '先按 token 预算 trimMessages；长会话再 summarizationMiddleware 摘要；更复杂的按需检索放 9.4。'
      ],
      [
        'Checkpointer 怎么选？',
        'MemorySaver 用于测试；跨进程 / 生产用 PostgresSaver 等持久化实现，并配套建表、TTL 与清理。'
      ]
    ]
  },
  {
    kind: 'note',
    tone: 'interview',
    title: '追问：为什么不用全局 Map 存会话？',
    text: '单进程、单实例、无重启时 Map 能用；一旦多实例、滚动发布或需要断点恢复，Map 就丢了。Checkpointer 把「状态存在哪」抽出来，业务不用改。'
  },
  {
    kind: 'links',
    title: '官方参考',
    items: [
      {
        label: 'LangGraph Persistence',
        href: 'https://docs.langchain.com/oss/javascript/langgraph/persistence',
        note: 'Checkpointer、thread_id 与状态快照'
      },
      {
        label: 'LangGraph Memory',
        href: 'https://docs.langchain.com/oss/javascript/langgraph/memory',
        note: '短期记忆与长期 Store'
      },
      {
        label: 'LangChain Short-term Memory',
        href: 'https://docs.langchain.com/oss/javascript/langchain/short-term-memory',
        note: 'Agent 记忆与裁剪'
      },
      {
        label: 'LangChain summarizationMiddleware',
        href: 'https://docs.langchain.com/oss/javascript/langchain/middleware/built-in#summarization',
        note: '触发条件与保留策略'
      }
    ]
  }
]
