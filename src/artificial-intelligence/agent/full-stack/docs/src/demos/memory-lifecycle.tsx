import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

type ThreadId = 'alice' | 'bob'
type Role = 'user' | 'assistant'

interface MemoryMessage {
  id: string
  role: Role
  text: string
}

type Threads = Record<ThreadId, MemoryMessage[]>

const threadLabels: Record<ThreadId, string> = {
  alice: 'Alice',
  bob: 'Bob'
}

const emptyThreads: Threads = { alice: [], bob: [] }

export function MemoryLifecycleDemo() {
  const [thread, setThread] = useState<ThreadId>('alice')
  const [remember, setRemember] = useState(true)
  const [trim, setTrim] = useState(false)
  const [input, setInput] = useState('我叫 Alice，喜欢喝美式')
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
        { id: id + '-a', role: 'assistant', text: '收到：' + text }
      ]
      const kept = trim && next.length > 6 ? next.slice(-6) : next
      return { ...current, [thread]: kept }
    })
    setInput('')
  }

  return (
    <DemoFrame
      title="Thread 生命周期实验台"
      hint="切 thread、开关 checkpointer 与裁剪，观察消息是累积、隔离还是被裁掉。">
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
              placeholder="输入一句话"
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
                ? `同一 thread_id 的第二轮会带上之前的 ${messages.length} 条消息。`
                : '每次 invoke 都是全新的 messages 数组。'}
            </p>
          </div>
        </div>

        <div className="tool-panel">
          <div className="tool-panel-head">
            <span>{threadLabels[thread]} 的 State.messages</span>
            <span>{messages.length} 条</span>
          </div>
          {messages.length === 0 ? (
            <p className="mem-empty">发送一句话，观察消息累积。</p>
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
        thread_id 决定「看哪份快照」，checkpointer 决定「有没有快照」，裁剪决定
        「快照里留多少」。三件事分开配，不要混成一个变量。
      </p>
    </DemoFrame>
  )
}
