import { useEffect, useRef, useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

interface Frame {
  id: number
  event: string
  data: string
  at: number
}

const chunks = ['退款', '会在', ' 3-5 ', '个工作日', '退回', '原支付渠道', '。']

export function SseStreamDemo() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [running, setRunning] = useState(false)
  const [connected, setConnected] = useState(true)
  const seq = useRef(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  function push(event: string, data: string) {
    seq.current += 1
    const frame: Frame = {
      id: seq.current,
      event,
      data,
      at: Date.now()
    }
    setFrames((current) => [...current, frame])
  }

  function start() {
    if (running) return
    if (timer.current) window.clearTimeout(timer.current)
    setFrames([])
    seq.current = 0
    setRunning(true)
    setConnected(true)
    push('meta', JSON.stringify({ requestId: 'req_01', model: 'demo-model' }))

    let index = 0
    const tick = () => {
      if (index >= chunks.length) {
        push('done', JSON.stringify({ finishReason: 'stop' }))
        setRunning(false)
        return
      }
      push('delta', JSON.stringify({ delta: chunks[index] }))
      index += 1
      timer.current = window.setTimeout(tick, 420)
    }
    timer.current = window.setTimeout(tick, 420)
  }

  function disconnect() {
    if (timer.current) window.clearTimeout(timer.current)
    setRunning(false)
    setConnected(false)
    push('error', JSON.stringify({ code: 'client_abort', retryable: true }))
  }

  const text = frames
    .filter((frame) => frame.event === 'delta')
    .map((frame) => {
      try {
        const parsed: unknown = JSON.parse(frame.data)
        return typeof parsed === 'object' &&
          parsed !== null &&
          'delta' in parsed
          ? String((parsed as { delta: unknown }).delta)
          : ''
      } catch {
        return ''
      }
    })
    .join('')

  const first = frames[0]?.at ?? 0
  const last = frames[frames.length - 1]?.at ?? 0

  return (
    <DemoFrame
      title="SSE 事件流模拟器"
      hint="点发送请求，观察每个 event / data 帧；中途断开，观察错误帧与重连依据。">
      <div className="sse-grid">
        <div className="sse-panel">
          <div className="sse-panel-head">
            <span>请求</span>
            <span className={connected ? 'sse-state ok' : 'sse-state bad'}>
              {connected ? 'connected' : 'disconnected'}
            </span>
          </div>
          <pre className="sse-request">
            {`POST /api/chat/stream
content-type: application/json
accept: text/event-stream

{"threadId":"t_01","message":"退款多久到账？"}`}
          </pre>
          <div className="demo-actions">
            <button type="button" className="demo-btn" onClick={start}>
              {running ? '发送中…' : '发送请求'}
            </button>
            <button
              type="button"
              className="demo-btn ghost"
              onClick={disconnect}>
              断开连接
            </button>
          </div>
          <div className="sse-answer">
            <span>前端拼出的文本</span>
            <p>{text || '等待第一个 delta…'}</p>
          </div>
        </div>

        <div className="sse-panel">
          <div className="sse-panel-head">
            <span>事件帧</span>
            <span>{frames.length} frames</span>
          </div>
          <div className="sse-frames">
            {frames.length === 0 ? (
              <p className="sse-empty">还没有事件。点「发送请求」。</p>
            ) : (
              frames.map((frame) => (
                <div key={frame.id} className={`sse-frame kind-${frame.event}`}>
                  <span className="sse-time">+{frame.at - first}ms</span>
                  <span className="sse-event">event: {frame.event}</span>
                  <code>data: {frame.data}</code>
                </div>
              ))
            )}
          </div>
          {frames.length > 1 ? (
            <p className="demo-note">
              首帧到末帧耗时 {last - first}ms。断线后前端靠{' '}
              <code>requestId</code> 或游标续传，而不是从头再问一遍。
            </p>
          ) : null}
        </div>
      </div>
    </DemoFrame>
  )
}
