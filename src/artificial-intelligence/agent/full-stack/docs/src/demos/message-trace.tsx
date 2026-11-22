import { DemoFrame } from '../components/demo-frame.tsx'
import { RichText } from '../components/rich-text.tsx'

type Tone = 'user' | 'assistant' | 'tool' | 'answer'

interface ToolCallView {
  name: string
  id: string
  args: string
}

interface TraceMessage {
  index: string
  role: string
  tone: Tone
  effect: string
  producer: string
  content: string
  mono?: boolean
  toolCalls?: ToolCallView[]
  toolCallId?: string
  exit?: boolean
}

interface TraceLane {
  tag: string
  title: string
  sub: string
  count: string
  message: TraceMessage
}

const CALL_ID = 'call_00_ET_hoDsnmp5RmWaMwX6TNrx8496'

const lanes: TraceLane[] = [
  {
    tag: '初始化',
    title: '创建 messages',
    sub: '写入 ①，作为第一次调用的输入',
    count: 'messages 0 → 1',
    message: {
      index: '①',
      role: 'USER',
      tone: 'user',
      effect: '任务输入',
      producer: 'createAgent 初始化',
      content: '订单 ORD-1024 到哪了？'
    }
  },
  {
    tag: '调用',
    title: '第 1 次 llm.chat',
    sub: '输入 ① · 模型返回 toolCalls',
    count: 'messages 1 → 2',
    message: {
      index: '②',
      role: 'ASSISTANT',
      tone: 'assistant',
      effect: 'Action',
      producer: '第 1 次 llm.chat 返回',
      content: '我来帮您查询订单 ORD-1024 的状态。',
      toolCalls: [
        {
          name: 'getOrder',
          id: CALL_ID,
          args: '{"orderId":"ORD-1024"}'
        }
      ]
    }
  },
  {
    tag: '回填',
    title: 'runTool 执行',
    sub: '按 name 查表、Zod 校验、序列化结果',
    count: 'messages 2 → 3',
    message: {
      index: '③',
      role: 'TOOL',
      tone: 'tool',
      effect: 'Observation',
      producer: 'runTool 执行后回填',
      content:
        '{"orderId":"ORD-1024","status":"已发货","carrier":"顺丰","eta":"明天 18:00 前"}',
      mono: true,
      toolCallId: CALL_ID
    }
  },
  {
    tag: '退出',
    title: '第 2 次 llm.chat',
    sub: '输入 ①②③ · toolCalls 为空，return content',
    count: 'messages 3 → 4',
    message: {
      index: '④',
      role: 'ASSISTANT',
      tone: 'answer',
      effect: 'Answer',
      producer: '第 2 次 llm.chat 返回',
      content:
        '您的订单 ORD-1024 目前状态是**已发货**，由**顺丰**承运，预计**明天 18:00 前**送达。',
      exit: true
    }
  }
]

export function MessageTraceDemo() {
  return (
    <DemoFrame
      tag="轨迹可视化"
      title="一次工具循环的 messages 轨迹"
      hint="看两个 llm.chat 轮次之间，runTool 如何用 toolCallId 把观察结果接回 assistant 的请求。">
      <ol className="react-trace">
        {lanes.map((lane) => (
          <li
            key={lane.message.index}
            className={`react-trace-item tone-${lane.message.tone}`}>
            <div className="react-trace-lane">
              <div className="react-trace-lane-main">
                <span className="react-trace-lane-tag">{lane.tag}</span>
                <strong>{lane.title}</strong>
                <span className="react-trace-lane-sub">{lane.sub}</span>
              </div>
              <span className="react-trace-lane-count">{lane.count}</span>
            </div>

            <article className={`react-trace-msg tone-${lane.message.tone}`}>
              <header className="react-trace-msg-head">
                <span className="react-trace-num">{lane.message.index}</span>
                <span className="react-trace-role">{lane.message.role}</span>
                <span className="react-trace-effect">
                  {lane.message.effect}
                </span>
                <span className="react-trace-producer">
                  {lane.message.producer}
                </span>
              </header>

              <div className="react-trace-content">
                <span className="react-trace-field">content</span>
                <p className={lane.message.mono ? 'mono' : undefined}>
                  <RichText text={lane.message.content} />
                </p>
              </div>

              {lane.message.toolCalls?.map((call, callIndex) => (
                <div key={call.id} className="react-trace-call">
                  <div className="react-trace-call-head">
                    <span>{`toolCalls[${callIndex}]`}</span>
                    <code>{call.name}</code>
                    <span className="react-trace-id">id {call.id}</span>
                  </div>
                  <div className="react-trace-args">
                    <span>arguments</span>
                    <code>{call.args}</code>
                  </div>
                </div>
              ))}

              {lane.message.toolCallId ? (
                <div className="react-trace-recon">
                  <code>toolCallId {lane.message.toolCallId}</code>
                  <span className="react-trace-recon-tag">
                    ↔ 与 ② 的 toolCalls[0].id 一致
                  </span>
                </div>
              ) : null}

              {lane.message.exit ? (
                <div className="react-trace-exit">toolCalls: [] · 循环退出</div>
              ) : null}
            </article>
          </li>
        ))}
      </ol>

      <p className="demo-note">
        循环的判定条件只看 <code>reply.toolCalls.length === 0</code>；
        <code>finish_reason</code> 属于协议层信号，本篇 core 没有依赖它。
      </p>
    </DemoFrame>
  )
}
