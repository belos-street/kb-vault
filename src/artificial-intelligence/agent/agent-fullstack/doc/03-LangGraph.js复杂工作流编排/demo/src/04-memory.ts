/**
 * 第 4 课 · 记忆：让图记得上一轮说过什么
 *
 * 到目前为止，每次 invoke 都是从一张白纸开始。
 * 想做成聊天机器人，就得把「每一轮结束时的 state」存下来，下一轮接着用。
 * LangGraph 把这件事做成了内建能力：Checkpointer（检查点存储器）。
 *
 * 三行代码就能拥有记忆：
 *   1. import { MemorySaver }
 *   2. .compile({ checkpointer: new MemorySaver() })
 *   3. invoke(input, { configurable: { thread_id: '用户标识' } })
 *
 * thread_id 就是「会话 id」：同一个 thread 共享同一份记忆，不同 thread 互相隔离。
 * 生产环境把 MemorySaver 换成 PostgresSaver / SqliteSaver，代码几乎不用改。
 *
 * 运行：bun run 04
 */
import {
  AIMessage,
  HumanMessage,
  type BaseMessage
} from '@langchain/core/messages'
import * as z from 'zod'
import {
  END,
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { banner, cyan, dim, green, kv, section, sleep, step } from './ui'

banner('第 4 课', '记忆：让图记得上一轮说过什么')

/* ---------------------------- State ---------------------------- */
const ChatState = new StateSchema({
  // 对话历史：MessagesValue 自带 append reducer，新消息自动追加
  messages: MessagesValue,
  // 从对话里学到的信息，跨轮次保存
  userName: z.string().optional(),
  // 这是第几轮（演示 state 会累积）
  turns: z.number().default(0)
})
type ChatStateType = typeof ChatState.State
type ChatUpdateType = typeof ChatState.Update

/** BaseMessage 的 content 可能是字符串，也可能是多模态数组 */
function textOf(message: BaseMessage | undefined): string {
  if (!message) return ''
  return typeof message.content === 'string' ? message.content : ''
}

/* ------------------------------------------------------------------ *
 * 唯一的节点：读历史里的最后一句话，生成回复
 * 真实项目里，这里就是一次 LLM 调用，messages 直接丢给模型即可
 * ------------------------------------------------------------------ */
async function chat(state: ChatStateType): Promise<ChatUpdateType> {
  await sleep(120)
  const lastUser = [...state.messages]
    .reverse()
    .find((message) => message.type === 'human')
  const text = textOf(lastUser)
  const turns = state.turns + 1

  let reply: string
  let userName = state.userName

  // 注意顺序：先判断「在提问」，再判断「在自我介绍」
  if (
    text.includes('我叫什么') ||
    text.includes('我是谁') ||
    text.includes('我的名字')
  ) {
    reply = userName ? `${userName} 呀，我记着呢。` : '你还没告诉过我名字。'
  } else {
    const match = text.match(/我叫([^，。！？,.!?\s]{1,4})/)
    const name = match?.[1]
    if (name) {
      userName = name
      reply = `记住了，你叫${name}。`
    } else {
      reply = `收到（第 ${turns} 轮）。history 里已经有 ${state.messages.length} 条消息了。`
    }
  }

  step('chat', `第 ${turns} 轮，看到 ${state.messages.length} 条历史消息`)
  // 只追加 assistant 回复；用户消息由本次 invoke 的输入负责追加
  return { messages: [new AIMessage(reply)], userName, turns }
}

/* ---------------------------- 拼图 ---------------------------- */
const checkpointer = new MemorySaver()

const graph = new StateGraph(ChatState)
  .addNode('chat', chat)
  .addEdge(START, 'chat')
  .addEdge('chat', END)
  .compile({ checkpointer })

/* --------------------------- 跑多轮 --------------------------- */
// config 是「这次运行的环境参数」：thread_id 决定读写哪个会话的记忆
const threadA = { configurable: { thread_id: 'user-A' } }
const threadB = { configurable: { thread_id: 'user-B' } }

async function say(text: string, config = threadA) {
  const result = await graph.invoke(
    { messages: [new HumanMessage(text)] },
    config
  )
  console.log(`  ${green('你')}：${text}`)
  console.log(`  ${cyan('Bot')}：${textOf(result.messages.at(-1))}\n`)
}

async function main() {
  section('同一个 thread（user-A）：三段独立调用，却像连续对话')
  await say('你好，我叫小明')
  await say('我叫什么名字？') // 没告诉它名字，但它记得
  await say('今天天气不错')

  section('换个 thread（user-B）：记忆是隔离的')
  await say('我叫什么名字？', threadB)

  section('记忆到底存在哪？用 getState 看一眼')
  const snapshot = await graph.getState(threadA)
  kv('values.userName', snapshot.values.userName)
  kv('values.turns', snapshot.values.turns)
  kv('values.messages', `${snapshot.values.messages.length} 条`)
  kv(
    'next',
    snapshot.next.length === 0
      ? '[]（已跑完，没有待执行的节点）'
      : snapshot.next
  )

  const history = await Array.fromAsync(graph.getStateHistory(threadA))
  kv('checkpoint 数量', `${history.length} 个（每一步都有快照，可以回放）`)

  console.log(
    '\n' +
      cyan('关键点：') +
      '\n  · 记忆 = checkpointer + thread_id，state 会自动落盘/回填；\n' +
      '  · 同一个 thread 再 invoke 时，只需要传「这一轮新增的输入」；\n' +
      '  · 因为每一步都有 checkpoint，你甚至可以「回到第 2 步改一句话再重跑」' +
      dim('（时间旅行）') +
      '；\n' +
      '  · 下一课：把「跑到哪一步了」实时打出来。\n'
  )
}

await main()
