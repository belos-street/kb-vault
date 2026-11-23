import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type ThreadId = 'ticket-1001' | 'ticket-1002'
type Role = 'user' | 'assistant'

interface MemoryMessage {
  id: string
  role: Role
  text: string
}

type Threads = Record<ThreadId, MemoryMessage[]>

const threadLabels: Record<ThreadId, string> = {
  'ticket-1001': '工单 1001',
  'ticket-1002': '工单 1002'
}

const emptyThreads: Threads = { 'ticket-1001': [], 'ticket-1002': [] }

const ORDER_PATTERN = /ORD-\d{4}/

function orderIdOf(text: string): string | undefined {
  return text.match(ORDER_PATTERN)?.[0]
}

function assistantReply(text: string, history: MemoryMessage[]): string {
  const direct = orderIdOf(text)
  if (direct) return '订单 ' + direct + ' 已发货，预计明天 18:00 前送达。'

  let remembered: string | undefined
  for (const message of [...history].reverse()) {
    remembered = orderIdOf(message.text)
    if (remembered) break
  }

  if (remembered && (text.includes('什么时候') || text.includes('到哪'))) {
    return '订单 ' + remembered + ' 已发货，预计明天 18:00 前送达。'
  }

  return '请提供订单号，例如 ORD-1024。'
}

export function MemoryLifecycleDemo() {
  const [thread, setThread] = useState<ThreadId>('ticket-1001')
  const [remember, setRemember] = useState(true)
  const [trim, setTrim] = useState(false)
  const [input, setInput] = useState('订单 ORD-1024 到哪了？')
  const [threads, setThreads] = useState<Threads>(emptyThreads)

  const messages = threads[thread]

  function send() {
    const text = input.trim()
    if (!text) return
    const id = String(Date.now())
    setThreads((current) => {
      const base = remember ? current[thread] : []
      const next: MemoryMessage[] = [
        ...base,
        { id: id + '-u', role: 'user', text },
        { id: id + '-a', role: 'assistant', text: assistantReply(text, base) }
      ]
      const kept = trim && next.length > 6 ? next.slice(-6) : next
      return { ...current, [thread]: kept }
    })
    setInput('')
  }

  return (
    <DemoFrame
      title="工单会话实验台"
      hint="切工单、开关 checkpointer 与裁剪，观察订单号是继承、隔离还是被裁掉。">
      <div className="mem-tabs">
        {(Object.keys(threadLabels) as ThreadId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`mem-tab${thread === id ? ' active' : ''}`}
            onClick={() => setThread(id)}>
            <strong>{threadLabels[id]}</strong>
            <span>{threads[id].length} 条消息</span>
          </button>
        ))}
      </div>

      <div className="mw-grid">
        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>状态控制</span>
            <span>thread_id: {thread}</span>
          </div>

          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => {
                setRemember((value) => !value)
                setThreads(emptyThreads)
              }}
            />
            <span>
              <strong>checkpointer</strong>
              <small>关闭后每次只保留当前一轮</small>
            </span>
          </label>

          <label className="mw-toggle">
            <input
              type="checkbox"
              checked={trim}
              onChange={() => setTrim((value) => !value)}
            />
            <span>
              <strong>上下文裁剪</strong>
              <small>只保留最近 6 条消息</small>
            </span>
          </label>

          <label className="tool-field">
            <span>新一轮消息</span>
            <input
              value={input}
              placeholder="例如：订单 ORD-1024 到哪了？"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') send()
              }}
            />
          </label>

          <button type="button" className="demo-btn" onClick={send}>
            发送
          </button>

          <div className={`tool-result${remember ? ' ok' : ' fail'}`}>
            <span>{remember ? '状态会累积' : '无 checkpointer'}</span>
            <p>
              {remember
                ? `同一 thread_id 的第二轮会带上之前的 ${messages.length} 条消息，追问时不用重复订单号。`
                : '每次 invoke 都是全新的 messages 数组，第二轮不会记得 ORD-1024。'}
            </p>
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>{threadLabels[thread]} 的 State.messages</span>
            <span>{messages.length} 条</span>
          </div>
          {messages.length === 0 ? (
            <p className="mem-empty">发送一句订单问题，观察消息累积。</p>
          ) : (
            <ol className="mem-list">
              {messages.map((message) => (
                <li key={message.id} className={message.role}>
                  <span>{message.role === 'user' ? 'Human' : 'AI'}</span>
                  <strong>{message.text}</strong>
                </li>
              ))}
            </ol>
          )}
          {trim && messages.length >= 6 ? (
            <p className="demo-warn">
              已按窗口裁剪：更早的消息不在 State.messages 里，模型看不到。
            </p>
          ) : null}
        </div>
      </div>

      <p className="demo-note">
        thread_id 用工单号 / 会话号：工单 1001 追问「那什么时候能到」时能沿用
        ORD-1024，工单 1002 不会串；关闭 checkpointer 后，第二轮又会反问订单号。
      </p>
    </DemoFrame>
  )
}
