import { useState } from 'react'
import { DemoFrame } from '../components/demo-frame.tsx'

export function ContextWindowDemo() {
  const [system, setSystem] = useState(800)
  const [history, setHistory] = useState(2400)
  const [retrieved, setRetrieved] = useState(3200)
  const [output, setOutput] = useState(800)
  const [limit, setLimit] = useState(8192)

  const used = system + history + retrieved + output
  const over = used > limit
  const percent = Math.min(100, (used / limit) * 100)
  const remaining = limit - used

  return (
    <DemoFrame
      title="上下文窗口占用"
      hint="调四段预算，看什么时候超窗；超窗时先裁历史，再裁检索。">
      <div className="demo-sliders">
        <label>
          <span>System Prompt：{system}</span>
          <input
            type="range"
            min={0}
            max={4000}
            step={100}
            value={system}
            onChange={(event) => setSystem(Number(event.target.value))}
          />
        </label>
        <label>
          <span>对话历史：{history}</span>
          <input
            type="range"
            min={0}
            max={8000}
            step={100}
            value={history}
            onChange={(event) => setHistory(Number(event.target.value))}
          />
        </label>
        <label>
          <span>检索上下文：{retrieved}</span>
          <input
            type="range"
            min={0}
            max={8000}
            step={100}
            value={retrieved}
            onChange={(event) => setRetrieved(Number(event.target.value))}
          />
        </label>
        <label>
          <span>预留输出：{output}</span>
          <input
            type="range"
            min={0}
            max={4000}
            step={100}
            value={output}
            onChange={(event) => setOutput(Number(event.target.value))}
          />
        </label>
        <label>
          <span>窗口上限：{limit}</span>
          <input
            type="range"
            min={4096}
            max={32768}
            step={1024}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </label>
      </div>

      <div className={`window-gauge${over ? ' over' : ''}`}>
        <div className="window-gauge-head">
          <strong>
            {used} / {limit} tokens
          </strong>
          <span>{over ? `超出 ${-remaining}` : `剩余 ${remaining}`}</span>
        </div>
        <div className="window-stack">
          <i
            className="stack-system"
            style={{ width: `${(system / limit) * 100}%` }}
          />
          <i
            className="stack-history"
            style={{ width: `${(history / limit) * 100}%` }}
          />
          <i
            className="stack-retrieved"
            style={{ width: `${(retrieved / limit) * 100}%` }}
          />
          <i
            className="stack-output"
            style={{ width: `${(output / limit) * 100}%` }}
          />
        </div>
        <div className="window-legend">
          <span>
            <i className="legend-system" /> System
          </span>
          <span>
            <i className="legend-history" /> 历史
          </span>
          <span>
            <i className="legend-retrieved" /> 检索
          </span>
          <span>
            <i className="legend-output" /> 输出
          </span>
        </div>
      </div>

      <div className="demo-actions">
        <button
          type="button"
          className="demo-btn"
          onClick={() => setHistory((value) => Math.round(value * 0.6))}>
          压缩历史 40%
        </button>
        <button
          type="button"
          className="demo-btn"
          onClick={() => setRetrieved((value) => Math.round(value * 0.6))}>
          压缩检索 40%
        </button>
        <button
          type="button"
          className="demo-btn ghost"
          onClick={() => {
            setSystem(800)
            setHistory(2400)
            setRetrieved(3200)
            setOutput(800)
            setLimit(8192)
          }}>
          重置
        </button>
      </div>

      <p className="demo-note">
        {over
          ? '已经超窗：优先压缩历史，其次减少检索片段，最后才动 system。不要把 system 当成「可裁的上下文」。'
          : `窗口还剩 ${remaining} tokens。给输出留出空间，比把输入塞满更重要。`}
        <span className="demo-percent"> 当前占用 {Math.round(percent)}%</span>
      </p>
    </DemoFrame>
  )
}
